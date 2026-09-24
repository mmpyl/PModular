import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { Invoice, InvoiceStatus, InvoiceType, SaleStatus } from '@prisma/client';
import { PseProviderFactory } from '../pse-provider/pse-provider.factory';
import {
  PseProviderType,
  SendInvoicePayload,
} from '../pse-provider/interfaces/pse-provider.interface';
import { AuditLogService } from '../audit-log/audit-log.service';
import { VoucherArchiveService } from '../voucher-archive/voucher-archive.service';
import { ListInvoicesQueryDto } from './dto/create-invoice.dto';

/**
 * Fase B5: Comprobantes fiscales electrónicos (boleta / factura)
 * Emisión -> envío a SUNAT vía PSE/OSE -> CDR -> archivo (retención 5 años)
 */
@Injectable()
export class ElectronicVoucherService {
  private readonly logger = new Logger(ElectronicVoucherService.name);
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_MS = 1000; // 1 segundo (base para backoff)

  constructor(
    private prisma: PrismaService,
    private pseProviderFactory: PseProviderFactory,
    private auditLogService: AuditLogService,
    private voucherArchiveService: VoucherArchiveService,
  ) {}

  /**
   * Crea un comprobante electrónico desde una venta cerrada
   */
  async createFromSale(saleId: string, issuedBy: string): Promise<Invoice> {
    this.logger.log(`Creando comprobante electrónico para venta: ${saleId}`);

    // Obtener venta con detalles
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: { include: { product: true } },
        organization: {
          include: {
            fiscalSettings: true,
          },
        },
        customer: true,
      },
    });

    if (!sale) {
      throw new NotFoundException('Venta no encontrada');
    }

    // Un comprobante solo puede emitirse sobre una venta ya cerrada/completada.
    const CLOSED_STATUSES: string[] = [SaleStatus.COMPLETADA];
    if (!CLOSED_STATUSES.includes(sale.status as string)) {
      throw new BadRequestException('La venta debe estar cerrada para generar comprobante');
    }

    // Verificar si ya existe invoice para esta venta
    const existingInvoice = await this.prisma.invoice.findUnique({
      where: { saleId },
    });

    if (existingInvoice) {
      throw new BadRequestException('Ya existe un comprobante para esta venta');
    }

    // Obtener configuración fiscal de la organización
    const fiscalSettings = sale.organization.fiscalSettings;
    if (!fiscalSettings || !fiscalSettings.isConfigured) {
      throw new BadRequestException('Organización sin configuración fiscal completa');
    }

    // Determinar tipo de comprobante según datos del cliente
    const tipoComprobante = this.determineInvoiceType(sale, fiscalSettings);

    // Serie/correlativo atómicos (evita duplicados ante ventas concurrentes)
    const serie = this.getCurrentSerie(fiscalSettings, tipoComprobante);
    const correlativo = await this.getNextCorrelativoAtomically(
      sale.organizationId,
      serie,
    );

    // Crear comprobante en estado PENDIENTE
    const invoice = await this.prisma.invoice.create({
      data: {
        organizationId: sale.organizationId,
        type: tipoComprobante,
        series: serie,
        correlation: correlativo,
        status: InvoiceStatus.PENDIENTE,
        issueDate: new Date(),
        subtotal: sale.subtotal,
        taxRate: sale.taxRate,
        taxAmount: sale.taxAmount,
        discount: sale.discount ?? 0,
        total: sale.total,
        currency: sale.currency ?? 'PEN',
        customerName: sale.customer?.name || 'CLIENTE GENERAL',
        customerTaxId: sale.customer?.taxId || undefined,
        customerAddress: sale.customer?.address,
        issuedBy,
        saleId,
      },
    });

    this.logger.log(`Comprobante creado: ${serie}-${correlativo} (${tipoComprobante})`);

    // Registrar auditoría
    await this.auditLogService.create({
      userId: issuedBy,
      action: 'OTHER',
      entityType: 'Invoice',
      entityId: invoice.id,
      organizationId: sale.organizationId,
      metadata: { event: 'INVOICE_CREATED', saleId, saleNumber: sale.saleNumber, tipoComprobante, serie, correlativo },
    });

    return invoice;
  }

  /**
   * Envía el comprobante al proveedor PSE/OSE (SUNAT)
   */
  async sendToPSE(invoiceId: string): Promise<{ success: boolean; cdr?: any; error?: string }> {
    this.logger.log(`Enviando comprobante a PSE: ${invoiceId}`);

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        sale: {
          include: {
            items: { include: { product: true, batch: true } },
            organization: {
              include: {
                fiscalSettings: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Comprobante no encontrado');
    }

    if (invoice.status !== InvoiceStatus.PENDIENTE && invoice.status !== InvoiceStatus.RECHAZADO) {
      throw new BadRequestException(`El comprobante está en estado ${invoice.status}, no puede ser enviado`);
    }

    const fiscalSettings = invoice.sale.organization.fiscalSettings;
    if (!fiscalSettings) {
      throw new BadRequestException('Configuración fiscal no encontrada');
    }

    // Actualizar estado a ENVIADO
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: InvoiceStatus.ENVIADO },
    });

    // Determinar proveedor PSE
    const providerType = this.getProviderType(fiscalSettings.pseProvider);
    const provider = this.pseProviderFactory.getProvider(providerType);

    // Construir payload para el proveedor
    const payload = this.buildPsePayload(invoice, fiscalSettings);

    // Intentar envío con reintentos
    let attempt = 0;
    let lastError: Error = new Error('No se realizó ningún intento');

    while (attempt < this.MAX_RETRY_ATTEMPTS) {
      try {
        const response = await provider.sendInvoice(payload);

        if (response.success && response.cdr) {
          // Éxito - actualizar con CDR
          await this.prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              status: InvoiceStatus.ACEPTADO,
              sunatResponseCode: response.cdr.codigoRespuesta,
              sunatResponseMessage: response.cdr.mensaje,
              cdrHash: response.cdr.hash,
              cdrXml: response.cdr.xmlContent,
              uuid: response.ticket,
            },
          });

          this.logger.log(`Comprobante aceptado: ${invoice.series}-${invoice.correlation}`);

          // Archivar XML + CDR (FE7: retención 5 años)
          try {
            const xmlContent = this.buildInvoiceXml(invoice, fiscalSettings);
            await this.voucherArchiveService.archiveVoucher(
              invoiceId,
              xmlContent,
              response.cdr.xmlContent ?? '',
            );
          } catch (archiveError) {
            // El fallo de archivado no debe revertir la aceptación del comprobante
            this.logger.error(
              `No se pudo archivar el comprobante ${invoiceId}: ${(archiveError as Error).message}`,
            );
          }

          // Sincronizar el número de comprobante electrónico en la venta
          if (invoice.saleId) {
            await this.prisma.sale
              .update({
                where: { id: invoice.saleId },
                data: { saleNumber: `${invoice.series}-${invoice.correlation}` },
              })
              .catch(() => undefined);
          }

          // Registrar auditoría
          await this.auditLogService.create({
            userId: invoice.issuedBy,
            action: 'OTHER',
            entityType: 'Invoice',
            entityId: invoice.id,
            organizationId: invoice.organizationId,
            metadata: { event: 'INVOICE_ACCEPTED', cdrHash: response.cdr.hash, uuid: response.ticket },
          });

          return { success: true, cdr: response.cdr };
        } else {
          throw new Error(response.error || 'Error en respuesta del proveedor');
        }
      } catch (error) {
        lastError = error as Error;
        attempt++;
        this.logger.warn(`Intento ${attempt} fallido: ${lastError.message}`);

        if (attempt < this.MAX_RETRY_ATTEMPTS) {
          await this.delay(this.RETRY_DELAY_MS * attempt); // backoff lineal
        }
      }
    }

    // Todos los intentos fallaron -> queda RECHAZADO para reintento manual
    this.logger.error(`Fallo después de ${this.MAX_RETRY_ATTEMPTS} intentos`);

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.RECHAZADO,
        sunatResponseMessage: `Fallo tras ${this.MAX_RETRY_ATTEMPTS} intentos: ${lastError.message}`,
      },
    });

    await this.auditLogService.create({
      userId: invoice.issuedBy,
      action: 'OTHER',
      entityType: 'Invoice',
      entityId: invoice.id,
      organizationId: invoice.organizationId,
      metadata: { event: 'INVOICE_REJECTED', attempts: this.MAX_RETRY_ATTEMPTS, error: lastError.message },
    });

    return { success: false, error: lastError.message };
  }

  /**
   * Emite y envía en un solo paso (flujo POS/mostrador)
   */
  async issueFromSale(saleId: string, issuedBy: string): Promise<{ invoice: Invoice; sent: boolean; error?: string }> {
    const invoice = await this.createFromSale(saleId, issuedBy);
    const result = await this.sendToPSE(invoice.id);
    const finalInvoice = await this.findOne(invoice.id, issuedBy);
    return { invoice: finalInvoice, sent: result.success, error: result.error };
  }

  /**
   * Reintenta el envío de un comprobante rechazado
   */
  async retrySend(invoiceId: string): Promise<{ success: boolean; cdr?: any; error?: string }> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) {
      throw new NotFoundException('Comprobante no encontrado');
    }
    if (invoice.status !== InvoiceStatus.RECHAZADO) {
      throw new BadRequestException('Solo se pueden reintentar comprobantes rechazados');
    }
    // Volver a PENDIENTE para permitir el envío
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: InvoiceStatus.PENDIENTE },
    });
    return this.sendToPSE(invoiceId);
  }

  /**
   * Anula un comprobante electrónico (baja por nota de crédito SUNAT)
   */
  async cancelInvoice(invoiceId: string, motivoAnulacion: string, issuedBy: string): Promise<Invoice> {
    this.logger.log(`Anulando comprobante: ${invoiceId}`);

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        organization: {
          include: {
            fiscalSettings: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Comprobante no encontrado');
    }

    if (invoice.status === InvoiceStatus.ANULADO) {
      throw new BadRequestException('El comprobante ya está anulado');
    }

    if (invoice.status !== InvoiceStatus.ACEPTADO) {
      throw new BadRequestException('Solo se pueden anular comprobantes aceptados');
    }

    const fiscalSettings = invoice.organization.fiscalSettings;
    if (!fiscalSettings) {
      throw new BadRequestException('Configuración fiscal no encontrada');
    }

    // Generar nota de crédito para anulación (serie configurada, correlativo atómico)
    const ncSerie = fiscalSettings.serieActualNotaCredito;
    const creditNote = await this.prisma.invoice.create({
      data: {
        organizationId: invoice.organizationId,
        type: InvoiceType.NOTA_CREDITO,
        series: ncSerie,
        correlation: await this.getNextCorrelativoAtomically(invoice.organizationId, ncSerie),
        status: InvoiceStatus.PENDIENTE,
        issueDate: new Date(),
        subtotal: -invoice.subtotal,
        taxRate: invoice.taxRate,
        taxAmount: -invoice.taxAmount,
        discount: 0,
        total: -invoice.total,
        currency: invoice.currency,
        customerName: invoice.customerName,
        customerTaxId: invoice.customerTaxId,
        customerAddress: invoice.customerAddress,
        issuedBy,
        notes: `Anulación de ${invoice.type} ${invoice.series}-${invoice.correlation}. Motivo: ${motivoAnulacion}`,
      },
    });

    // Enviar nota de crédito a SUNAT
    await this.sendToPSE(creditNote.id);

    // Actualizar invoice original
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.ANULADO,
        internalNotes: `Anulado por NC ${creditNote.series}-${creditNote.correlation}`,
      },
    });

    // Registrar auditoría
    await this.auditLogService.create({
      userId: issuedBy,
      action: 'OTHER',
      entityType: 'Invoice',
      entityId: invoice.id,
      organizationId: invoice.organizationId,
      metadata: { event: 'INVOICE_CANCELLED', creditNoteId: creditNote.id, motivo: motivoAnulacion },
    });

    return updatedInvoice;
  }

  /**
   * Lista comprobantes de una organización con filtros y paginación
   */
  async findAll(organizationId: string, query: ListInvoicesQueryDto) {
    if (!organizationId) {
      throw new BadRequestException('organizationId es requerido');
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.InvoiceWhereInput = {
      organizationId,
      ...(query.status ? { status: query.status as InvoiceStatus } : {}),
      ...(query.type ? { type: query.type as InvoiceType } : {}),
      ...(query.search
        ? {
            OR: [
              { series: { contains: query.search, mode: 'insensitive' } },
              { correlation: { contains: query.search, mode: 'insensitive' } },
              { customerName: { contains: query.search, mode: 'insensitive' } },
              { customerTaxId: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.from || query.to
        ? {
            issueDate: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        include: {
          sale: { select: { id: true, saleNumber: true, status: true } },
          archive: { select: { id: true, xmlHash: true, retentionUntil: true } },
        },
        orderBy: { issueDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Obtiene un comprobante por ID (con trazabilidad de acceso)
   */
  async findOne(
    id: string,
    userId?: string,
  ): Promise<Invoice & { sale?: { id: string; saleNumber: string; status: string } | null; archive?: any | null }> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        sale: { select: { id: true, saleNumber: true, status: true } },
        archive: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Comprobante no encontrado');
    }

    if (userId) {
      await this.auditLogService.create({
        userId,
        action: 'OTHER',
        entityType: 'Invoice',
        entityId: invoice.id,
        organizationId: invoice.organizationId,
        metadata: { event: 'INVOICE_VIEWED' },
      });
    }

    return invoice;
  }

  /**
   * Descarga el XML firmado/archivado del comprobante
   */
  async downloadXML(id: string, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Comprobante no encontrado');
    }

    let xmlContent: string;
    try {
      const archived = await this.voucherArchiveService.getXML(id, userId);
      xmlContent = archived.xmlContent;
    } catch {
      // Si aún no fue archivado (pendiente/rechazado), generar XML sobre la marcha
      const full = await this.prisma.invoice.findUnique({
        where: { id },
        include: {
          sale: {
            include: {
              items: { include: { product: true } },
              organization: { include: { fiscalSettings: true } },
            },
          },
        },
      });
      if (!full?.sale?.organization?.fiscalSettings) {
        throw new NotFoundException('XML no disponible: comprobante no archivado y sin configuración fiscal');
      }
      xmlContent = this.buildInvoiceXml(full, full.sale.organization.fiscalSettings);
    }

    return {
      filename: `${invoice.series}-${invoice.correlation}.xml`,
      contentType: 'application/xml',
      content: xmlContent,
    };
  }

  /**
   * Descarga el CDR (Constancia de Recepción SUNAT)
   */
  async downloadCDR(id: string, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Comprobante no encontrado');
    }

    const cdr =
      (await this.voucherArchiveService.getCDR(id, userId).catch(() => null)) ??
      invoice.cdrXml;

    if (!cdr) {
      throw new NotFoundException('El comprobante aún no tiene CDR disponible');
    }

    return {
      filename: `${invoice.series}-${invoice.correlation}-cdr.xml`,
      contentType: 'application/xml',
      content: cdr,
    };
  }

  /**
   * Verifica integridad del archivo (hash SHA-256)
   */
  async verifyIntegrity(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Comprobante no encontrado');
    }
    return this.voucherArchiveService.verifyIntegrity(id);
  }

  /**
   * Estadísticas básicas de comprobantes por organización
   */
  async getStats(organizationId: string) {
    if (!organizationId) {
      throw new BadRequestException('organizationId es requerido');
    }

    const [byStatus, byType, totalAmount] = await this.prisma.$transaction([
      this.prisma.invoice.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: { _all: true },
      }),
      this.prisma.invoice.groupBy({
        by: ['type'],
        where: { organizationId },
        _count: { _all: true },
      }),
      this.prisma.invoice.aggregate({
        where: { organizationId, status: InvoiceStatus.ACEPTADO },
        _sum: { total: true },
      }),
    ]);

    return {
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      byType: Object.fromEntries(byType.map((t) => [t.type, t._count._all])),
      acceptedTotal: totalAmount._sum.total ?? 0,
    };
  }

  /**
   * Determina el tipo de comprobante según reglas SUNAT
   */
  private determineInvoiceType(sale: any, fiscalSettings: any): InvoiceType {
    // Boleta electrónica: consumidor final sin RUC
    if (!sale.customer?.taxId) {
      return InvoiceType.BOLETA;
    }

    // Si el cliente tiene RUC válido (11 dígitos) -> Factura
    if (sale.customer.taxId.length === 11) {
      return InvoiceType.FACTURA;
    }

    // DNI u otro documento -> Boleta
    return InvoiceType.BOLETA;
  }

  /**
   * Obtiene la serie actual para un tipo de comprobante
   */
  private getCurrentSerie(fiscalSettings: any, tipoComprobante: InvoiceType): string {
    switch (tipoComprobante) {
      case InvoiceType.FACTURA:
        return fiscalSettings.serieActualFactura;
      case InvoiceType.BOLETA:
        return fiscalSettings.serieActualBoleta;
      case InvoiceType.NOTA_CREDITO:
        return fiscalSettings.serieActualNotaCredito;
      case InvoiceType.NOTA_DEBITO:
        return fiscalSettings.serieActualNotaDebito;
      default:
        return 'F001';
    }
  }

  /**
   * Reserva el siguiente correlativo de forma atómica dentro de una transacción.
   * Usa UPDATE ... RETURNING para evitar condiciones de carrera entre ventas concurrentes.
   */
  private async getNextCorrelativoAtomically(organizationId: string, serie: string): Promise<string> {
    const nextValue = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const rows = await tx.$queryRaw<Array<{ ultimosCorrelativos: Prisma.JsonValue }>>`
        UPDATE "organization_fiscal_settings"
        SET "ultimosCorrelativos" = jsonb_set(
          COALESCE("ultimosCorrelativos", '{}'::jsonb),
          ARRAY[${serie}]::text[],
          to_jsonb(COALESCE(("ultimosCorrelativos" ->> ${serie})::int, 0) + 1),
          true
        ),
        "updatedAt" = CURRENT_TIMESTAMP
        WHERE "organizationId" = ${organizationId}::uuid
        RETURNING "ultimosCorrelativos" AS "ultimosCorrelativos"
      `;

      if (!rows.length) {
        throw new BadRequestException('Configuración fiscal no encontrada para la organización');
      }

      const current = rows[0].ultimosCorrelativos as Record<string, number>;
      return Number(current?.[serie]);
    });

    if (!nextValue || Number.isNaN(nextValue)) {
      throw new BadRequestException('No se pudo obtener el siguiente correlativo');
    }

    return String(nextValue).padStart(8, '0');
  }

  /**
   * Construye el payload para enviar al proveedor PSE
   */
  private buildPsePayload(invoice: any, fiscalSettings: any): SendInvoicePayload {
    const igvRate = Number(fiscalSettings.igvRate ?? 18);
    const divisor = 1 + igvRate / 100;

    return {
      organizationId: invoice.organizationId,
      ruc: fiscalSettings.ruc,
      tipoComprobante: invoice.type,
      serie: invoice.series,
      correlativo: invoice.correlation,
      fechaEmision: invoice.issueDate.toISOString(),
      cliente: {
        nombre: invoice.customerName,
        documento: invoice.customerTaxId ?? '',
        direccion: invoice.customerAddress,
      },
      items: (invoice.sale?.items ?? []).map((item: any, index: number) => {
        const price = Number(item.price);
        const quantity = Number(item.quantity);
        const lineTotal = price * quantity;
        return {
          numeroItem: index + 1,
          codigoProducto: item.product?.sku ?? item.productId,
          descripcion: item.product?.name ?? 'Producto',
          cantidad: quantity,
          unidadMedida: 'NIU', // Unidad internacional (SUNAT)
          precioUnitario: price,
          valorUnitario: Number((price / divisor).toFixed(2)),
          igv: Number((lineTotal - lineTotal / divisor).toFixed(2)),
          importeTotal: Number(lineTotal.toFixed(2)),
        };
      }),
      totales: {
        subtotal: Number(invoice.subtotal),
        igv: Number(invoice.taxAmount),
        descuento: Number(invoice.discount ?? 0),
        total: Number(invoice.total),
      },
      observaciones: invoice.notes ?? undefined,
    };
  }

  /**
   * Genera una representación XML del comprobante (UBL simplificado)
   * para su archivado. En producción se reemplaza por el XML UBL 2.1
   * firmado generado junto con el proveedor PSE.
   */
  private buildInvoiceXml(invoice: any, fiscalSettings: any): string {
    const esc = (value: unknown) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const items = (invoice.sale?.items ?? [])
      .map(
        (item: any, index: number) => `    <OrderLine>
      <lineNumber>${index + 1}</lineNumber>
      <sku>${esc(item.product?.sku)}</sku>
      <name>${esc(item.product?.name)}</name>
      <quantity>${Number(item.quantity)}</quantity>
      <unitPrice>${Number(item.price)}</unitPrice>
      <lineTotal>${(Number(item.quantity) * Number(item.price)).toFixed(2)}</lineTotal>
    </OrderLine>`,
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <ID>${esc(invoice.series)}-${esc(invoice.correlation)}</ID>
  <InvoiceType>${esc(invoice.type)}</InvoiceType>
  <IssueDate>${new Date(invoice.issueDate).toISOString()}</IssueDate>
  <CurrencyID>${esc(invoice.currency)}</CurrencyID>
  <Supplier>
    <RUC>${esc(fiscalSettings.ruc)}</RUC>
    <Name>${esc(fiscalSettings.razonSocial)}</Name>
    <Address>${esc(fiscalSettings.direccion)}</Address>
    <Ubige>${esc(fiscalSettings.ubige)}</Ubige>
  </Supplier>
  <Customer>
    <Name>${esc(invoice.customerName)}</Name>
    <TaxID>${esc(invoice.customerTaxId)}</TaxID>
    <Address>${esc(invoice.customerAddress)}</Address>
  </Customer>
  <AllowanceCharge chargeIndicator="false">${esc(invoice.discount)}</AllowanceCharge>
  <TaxTotal>${esc(invoice.taxAmount)}</TaxTotal>
  <LegalMonetaryTotal>
    <LineExtensionAmount>${esc(invoice.subtotal)}</LineExtensionAmount>
    <TaxExclusiveAmount>${esc(invoice.subtotal)}</TaxExclusiveAmount>
    <PayableAmount>${esc(invoice.total)}</PayableAmount>
  </LegalMonetaryTotal>
${items}
</Invoice>`;
  }

  /**
   * Mapea el nombre del proveedor al enum
   */
  private getProviderType(providerName?: string): PseProviderType {
    if (!providerName) {
      return PseProviderType.NUBEFACT; // Default recomendado
    }

    const normalized = providerName.toUpperCase();
    if (normalized.includes('NUBE')) return PseProviderType.NUBEFACT;
    if (normalized.includes('SUNAT')) return PseProviderType.SUNAT_DIRECTO;
    if (normalized.includes('FACTIBLE')) return PseProviderType.SOLUCION_FACTIBLE;

    return PseProviderType.NUBEFACT;
  }

  /**
   * Retardo para reintentos
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
