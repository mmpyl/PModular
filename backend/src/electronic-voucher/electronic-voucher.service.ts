import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Invoice, InvoiceStatus, InvoiceType } from '@prisma/client';
import { PseProviderFactory } from '../pse-provider/pse-provider.factory';
import { PseProviderType } from '../pse-provider/interfaces/pse-provider.interface';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class ElectronicVoucherService {
  private readonly logger = new Logger(ElectronicVoucherService.name);
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_MS = 5000; // 5 segundos

  constructor(
    private prisma: PrismaService,
    private pseProviderFactory: PseProviderFactory,
    private auditLogService: AuditLogService,
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

    if (sale.status !== 'CERRADA') {
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

    // Determinar tipo de comprobante según monto y datos del cliente
    const tipoComprobante = this.determineInvoiceType(sale, fiscalSettings);

    // Obtener siguiente correlativo
    const serie = this.getCurrentSerie(fiscalSettings, tipoComprobante);
    const correlativo = await this.getNextCorrelativo(sale.organizationId, tipoComprobante, serie);

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
        discount: sale.discount || 0,
        total: sale.total,
        currency: 'PEN',
        customerName: sale.customer?.name || 'CLIENTE GENERAL',
        customerTaxId: sale.customer?.taxId || '00000000000',
        customerAddress: sale.customer?.address,
        issuedBy,
        saleId,
      },
    });

    this.logger.log(`Comprobante creado: ${serie}-${correlativo} (${tipoComprobante})`);

    // Registrar auditoría
    await this.auditLogService.create({
      organizationId: sale.organizationId,
      userId: issuedBy,
      action: 'INVOICE_CREATED',
      resourceType: 'Invoice',
      resourceId: invoice.id,
      details: { saleId, tipoComprobante, serie, correlativo },
    });

    return invoice;
  }

  /**
   * Envía el comprobante al proveedor PSE/OSE
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

    if (invoice.status !== InvoiceStatus.PENDIENTE) {
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
    let lastError: Error;

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

          // Registrar auditoría
          await this.auditLogService.create({
            organizationId: invoice.organizationId,
            userId: invoice.issuedBy,
            action: 'INVOICE_ACCEPTED',
            resourceType: 'Invoice',
            resourceId: invoice.id,
            details: { cdrHash: response.cdr.hash },
          });

          return { success: true, cdr: response.cdr };
        } else {
          throw new Error(response.error || 'Error en respuesta del proveedor');
        }
      } catch (error) {
        lastError = error;
        attempt++;
        this.logger.warn(`Intento ${attempt} fallido: ${error.message}`);

        if (attempt < this.MAX_RETRY_ATTEMPTS) {
          await this.delay(this.RETRY_DELAY_MS * attempt); // Exponential backoff
        }
      }
    }

    // Todos los intentos fallaron - modo contingencia
    this.logger.error(`Fallo después de ${this.MAX_RETRY_ATTEMPTS} intentos`);

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.RECHAZADO,
        sunatResponseMessage: `Fallo tras ${this.MAX_RETRY_ATTEMPTS} intentos: ${lastError.message}`,
      },
    });

    return { success: false, error: lastError.message };
  }

  /**
   * Anula un comprobante electrónico
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

    // Generar nota de crédito para anulación
    const creditNote = await this.prisma.invoice.create({
      data: {
        organizationId: invoice.organizationId,
        type: InvoiceType.NOTA_CREDITO,
        series: 'FC01', // Serie para notas de crédito
        correlation: await this.getNextCorrelativo(invoice.organizationId, InvoiceType.NOTA_CREDITO, 'FC01'),
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
      organizationId: invoice.organizationId,
      userId: issuedBy,
      action: 'INVOICE_CANCELLED',
      resourceType: 'Invoice',
      resourceId: invoice.id,
      details: { creditNoteId: creditNote.id, motivo: motivoAnulacion },
    });

    return updatedInvoice;
  }

  /**
   * Determina el tipo de comprobante según reglas SUNAT
   */
  private determineInvoiceType(sale: any, fiscalSettings: any): InvoiceType {
    // Si el cliente tiene RUC y lo solicita -> Factura
    if (sale.customer?.taxId && sale.customer.taxId.length === 11) {
      return InvoiceType.FACTURA;
    }

    // Por defecto para consumidores finales -> Boleta
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
   * Obtiene el siguiente correlativo de forma atómica
   */
  private async getNextCorrelativo(organizationId: string, tipoComprobante: InvoiceType, serie: string): Promise<string> {
    const settings = await this.prisma.organizationFiscalSettings.findUnique({
      where: { organizationId },
    });

    const ultimosCorrelativos = settings.ultimosCorrelativos as Record<string, number> || {};
    const key = `${serie}`;
    const currentCorrelativo = ultimosCorrelativos[key] || 0;
    const nextCorrelativo = currentCorrelativo + 1;

    ultimosCorrelativos[key] = nextCorrelativo;

    await this.prisma.organizationFiscalSettings.update({
      where: { organizationId },
      data: { ultimosCorrelativos },
    });

    return nextCorrelativo.toString().padStart(8, '0');
  }

  /**
   * Construye el payload para enviar al proveedor PSE
   */
  private buildPsePayload(invoice: any, fiscalSettings: any): any {
    return {
      organizationId: invoice.organizationId,
      ruc: fiscalSettings.ruc,
      tipoComprobante: invoice.type,
      serie: invoice.series,
      correlativo: invoice.correlation,
      fechaEmision: invoice.issueDate.toISOString(),
      cliente: {
        nombre: invoice.customerName,
        documento: invoice.customerTaxId,
        direccion: invoice.customerAddress,
      },
      items: invoice.sale.items.map((item, index) => ({
        numeroItem: index + 1,
        codigoProducto: item.product.sku,
        descripcion: item.product.name,
        cantidad: item.quantity,
        unidadMedida: 'NIU', // Unidad internacional
        precioUnitario: Number(item.price),
        valorUnitario: Number(item.price) / (1 + Number(invoice.taxRate) / 100),
        igv: (Number(item.price) * Number(invoice.taxRate) / 100) / (1 + Number(invoice.taxRate) / 100),
        importeTotal: Number(item.price) * Number(item.quantity),
      })),
      totales: {
        subtotal: Number(invoice.subtotal),
        igv: Number(invoice.taxAmount),
        descuento: Number(invoice.discount),
        total: Number(invoice.total),
      },
    };
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
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
