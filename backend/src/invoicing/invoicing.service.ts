import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import {
  ElectronicDocumentStatus,
  ElectronicDocumentType,
  Prisma,
  SaleStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { SaveNubefactSettingsDto } from './dto/invoicing.dto';

type PublicSettings = {
  currency?: string;
  timezone?: string;
  billing?: {
    fiscal?: { ruc?: string; legalName?: string; address?: string };
    series?: {
      ticket?: string; boleta?: string; factura?: string;
      ticketNextNumber?: number; boletaNextNumber?: number; facturaNextNumber?: number;
    };
    yapeAccounts?: { id: string; provider: string; label: string; phone: string; holder?: string; code?: string; qrImageUrl?: string; enabled?: boolean }[];
  };
};

type NubefactResponse = {
  aceptada_por_sunat?: boolean;
  sunat_description?: string;
  sunat_note?: string;
  sunat_responsecode?: string | number;
  enlace?: string;
  enlace_del_pdf?: string;
  enlace_del_xml?: string;
  enlace_del_cdr?: string;
  cadena_para_codigo_qr?: string;
  codigo_hash?: string;
};

type NubefactItem = {
  unidad_de_medida: string;
  codigo: string;
  descripcion: string;
  cantidad: number;
  valor_unitario: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
  tipo_de_igv: number;
  igv: number;
  total: number;
  anticipo_regularizacion: boolean;
};

@Injectable()
export class InvoicingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getNubefactSettings(organizationId: string) {
    const integration = await this.prisma.organizationIntegration.findUnique({
      where: { organizationId_provider: { organizationId, provider: 'NUBEFACT' } },
      select: { endpointUrl: true, encryptedToken: true, updatedAt: true },
    });
    return {
      configured: Boolean(integration),
      endpointUrl: integration?.endpointUrl ?? null,
      endpointHost: integration ? new URL(integration.endpointUrl).host : null,
      tokenConfigured: Boolean(integration?.encryptedToken),
      encryptionKeyConfigured: Boolean(this.getEncryptionKey(false)),
      updatedAt: integration?.updatedAt ?? null,
    };
  }

  async saveNubefactSettings(organizationId: string, dto: SaveNubefactSettingsDto) {
    const endpoint = this.validateNubefactEndpoint(dto.endpointUrl);
    const existing = await this.prisma.organizationIntegration.findUnique({
      where: { organizationId_provider: { organizationId, provider: 'NUBEFACT' } },
    });
    const token = dto.token?.trim();
    if (!existing && !token) {
      throw new BadRequestException('Ingresa el token de Nubefact para configurar la primera vez');
    }
    const encryptedToken = token ? this.encryptToken(token) : existing!.encryptedToken;
    await this.prisma.organizationIntegration.upsert({
      where: { organizationId_provider: { organizationId, provider: 'NUBEFACT' } },
      create: { organizationId, provider: 'NUBEFACT', endpointUrl: endpoint.toString(), encryptedToken },
      update: { endpointUrl: endpoint.toString(), encryptedToken },
    });
    return this.getNubefactSettings(organizationId);
  }

  async issueDocument(organizationId: string, saleId: string, type: ElectronicDocumentType) {
    const [sale, organization] = await Promise.all([
      this.prisma.sale.findFirst({
        where: { id: saleId, organizationId },
        include: {
          customer: true,
          items: { include: { product: { include: { unit: true } } } },
          electronicDocuments: { where: { type }, take: 1 },
        },
      }),
      this.prisma.organization.findUnique({ where: { id: organizationId }, select: { settings: true } }),
    ]);
    if (!sale) throw new NotFoundException('Venta no encontrada en esta organización');
    if (!organization) throw new NotFoundException('Organización no encontrada');
    const issuableStatuses: SaleStatus[] = [SaleStatus.CONFIRMADA, SaleStatus.COMPLETADA];
    if (!issuableStatuses.includes(sale.status)) {
      throw new BadRequestException('Confirma la venta antes de emitir un comprobante');
    }
    const previousDocument = sale.electronicDocuments[0];
    if (previousDocument && previousDocument.status !== ElectronicDocumentStatus.RECHAZADO) {
      throw new ConflictException(previousDocument.status === ElectronicDocumentStatus.ERROR
        ? 'La respuesta del proveedor quedó incierta. Verifica el estado en Nubefact antes de emitir nuevamente.'
        : 'Ya existe un comprobante de este tipo para la venta');
    }

    const settings = this.asPublicSettings(organization.settings);
    const series = previousDocument?.series ?? this.getSeries(settings, type);
    const startingNumber = this.getStartingNumber(settings, type);
    const integration = type === ElectronicDocumentType.TICKET ? null : await this.getNubefactIntegration(organizationId);
    let payload: Record<string, unknown> | null = null;
    let token: string | null = null;

    if (type !== ElectronicDocumentType.TICKET) {
      const fiscal = settings.billing?.fiscal;
      if (!/^\d{11}$/.test(fiscal?.ruc ?? '') || !fiscal?.legalName?.trim()) {
        throw new BadRequestException('Configura el RUC y la razón social del emisor antes de emitir documentos electrónicos');
      }
      if (sale.currency !== 'PEN') {
        throw new BadRequestException('La emisión SUNAT está configurada para ventas en soles (PEN)');
      }
      if (!sale.customer && type === ElectronicDocumentType.FACTURA) {
        throw new BadRequestException('La factura requiere un cliente con RUC');
      }
      if (type === ElectronicDocumentType.FACTURA && !/^\d{11}$/.test(sale.customer?.taxId ?? '')) {
        throw new BadRequestException('La factura requiere un RUC de cliente de 11 dígitos');
      }
      if (type === ElectronicDocumentType.BOLETA && Number(sale.total) >= 700 && !/^\d{8,11}$/.test(sale.customer?.taxId ?? '')) {
        throw new BadRequestException('Para una boleta de S/ 700 o más, registra DNI o RUC del cliente');
      }
      if (Number(sale.discount) - sale.items.reduce((sum, item) => sum + Number(item.discount), 0) > 0.01) {
        throw new BadRequestException('Distribuye el descuento global entre las líneas antes de emitir por Nubefact');
      }
      if (sale.items.some((item) => ![0, 0.18].some((rate) => Math.abs(Number(item.taxRate) - rate) < 0.0001))) {
        throw new BadRequestException('Nubefact solo está habilitado para líneas sin IGV o con IGV de 18%');
      }
      if (!integration) {
        throw new ServiceUnavailableException('Configura la ruta y el token de Nubefact en Configuración');
      }
      token = this.decryptToken(integration.encryptedToken);
    }

    const document = previousDocument
      ? await this.prisma.electronicDocument.update({
        where: { id: previousDocument.id },
        data: { status: ElectronicDocumentStatus.PENDIENTE, message: null, providerCode: null },
      })
      : await this.reserveDocument(organizationId, saleId, type, series, startingNumber, type === ElectronicDocumentType.TICKET ? 'LOCAL' : 'NUBEFACT');
    if (type === ElectronicDocumentType.TICKET) return document;

    payload = this.buildNubefactPayload(sale, type, series, document.number, settings.timezone ?? 'America/Lima');
    try {
      let response = await this.postToNubefact(integration!.endpointUrl, token!, payload, 'Bearer');
      if (response.status === 401 || response.status === 403) {
        response = await this.postToNubefact(integration!.endpointUrl, token!, payload, 'Token');
      }
      const result = await response.json() as NubefactResponse;
      if (!response.ok) {
        const message = this.safeProviderMessage(result.sunat_description) || `Nubefact devolvió HTTP ${response.status}`;
        return this.prisma.electronicDocument.update({
          where: { id: document.id },
          data: { status: ElectronicDocumentStatus.RECHAZADO, providerCode: String(response.status), message },
        });
      }

      const accepted = result.aceptada_por_sunat === true;
      return this.prisma.electronicDocument.update({
        where: { id: document.id },
        data: {
          status: accepted ? ElectronicDocumentStatus.ACEPTADO : ElectronicDocumentStatus.RECHAZADO,
          providerCode: result.sunat_responsecode == null ? null : String(result.sunat_responsecode),
          message: this.safeProviderMessage(result.sunat_description || result.sunat_note),
          pdfUrl: this.safeProviderUrl(result.enlace_del_pdf),
          xmlUrl: this.safeProviderUrl(result.enlace_del_xml),
          cdrUrl: this.safeProviderUrl(result.enlace_del_cdr),
          qrData: result.cadena_para_codigo_qr?.slice(0, 1000) ?? null,
          issuedAt: accepted ? new Date() : null,
        },
      });
    } catch (error) {
      await this.prisma.electronicDocument.update({
        where: { id: document.id },
        data: {
          status: ElectronicDocumentStatus.ERROR,
          message: error instanceof Error && error.name === 'TimeoutError'
            ? 'Tiempo de espera agotado al consultar Nubefact. Verifica el estado antes de volver a emitir.'
            : 'No se pudo confirmar la respuesta de Nubefact. Verifica el estado antes de volver a emitir.',
        },
      });
      throw new ServiceUnavailableException('No se pudo confirmar la emisión con Nubefact; el correlativo quedó reservado para evitar duplicados');
    }
  }

  listSaleDocuments(organizationId: string, saleId: string) {
    return this.prisma.electronicDocument.findMany({
      where: { organizationId, saleId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async reserveDocument(
    organizationId: string,
    saleId: string,
    type: ElectronicDocumentType,
    series: string,
    startingNumber: number,
    provider: string,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const current = await tx.electronicDocument.aggregate({
          where: { organizationId, type, series },
          _max: { number: true },
        });
        return tx.electronicDocument.create({
          data: {
            organizationId,
            saleId,
            type,
            series,
            number: Math.max((current._max.number ?? 0) + 1, startingNumber),
            status: type === ElectronicDocumentType.TICKET ? ElectronicDocumentStatus.LOCAL : ElectronicDocumentStatus.PENDIENTE,
            provider,
            issuedAt: type === ElectronicDocumentType.TICKET ? new Date() : null,
          },
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe un comprobante o hubo una colisión de correlativo; actualiza e intenta nuevamente');
      }
      throw error;
    }
  }

  private buildNubefactPayload(sale: Prisma.SaleGetPayload<{
    include: { customer: true; items: { include: { product: { include: { unit: true } } } } }
  }>, type: ElectronicDocumentType, series: string, number: number, timezone: string) {
    const isInvoice = type === ElectronicDocumentType.FACTURA;
    const customerTaxId = sale.customer?.taxId ?? '';
    const customerDocumentType = customerTaxId.length === 11 ? 6 : customerTaxId.length === 8 ? 1 : 0;
    const taxable = sale.items.filter((item) => Number(item.taxRate) > 0);
    const unaffected = sale.items.filter((item) => Number(item.taxRate) === 0);
    const totalTaxable = taxable.reduce((sum, item) => sum + Number(item.subtotal) - Number(item.discount), 0);
    const totalUnaffected = unaffected.reduce((sum, item) => sum + Number(item.subtotal) - Number(item.discount), 0);
    const items: NubefactItem[] = sale.items.map((item) => {
      const quantity = Number(item.quantity);
      const unitValue = Number(item.unitPrice);
      const discount = Number(item.discount);
      const base = Number(item.subtotal) - discount;
      const rate = Number(item.taxRate);
      const unitName = item.product.unit?.symbol?.toUpperCase() ?? '';
      const validUnits = ['NIU', 'ZZ', 'KGM', 'LTR', 'MTR', 'MTQ', 'BX', 'DZN'];
      return {
        unidad_de_medida: validUnits.includes(unitName) ? unitName : 'NIU',
        codigo: item.product.sku || item.productId,
        descripcion: item.product.name,
        cantidad: quantity,
        valor_unitario: unitValue,
        precio_unitario: Number((unitValue * (1 + rate)).toFixed(2)),
        descuento: discount,
        subtotal: base,
        tipo_de_igv: rate > 0 ? 1 : 30,
        igv: Number(item.taxAmount),
        total: Number(item.total),
        anticipo_regularizacion: false,
      };
    });

    return {
      operacion: 'generar_comprobante',
      tipo_de_comprobante: isInvoice ? 1 : 2,
      serie: series,
      numero: number,
      sunat_transaction: 1,
      cliente_tipo_de_documento: customerDocumentType,
      cliente_numero_de_documento: customerTaxId || '-',
      cliente_denominacion: sale.customer?.name ?? 'CLIENTES VARIOS',
      cliente_direccion: sale.customer?.address ?? '',
      cliente_email: sale.customer?.email ?? '',
      fecha_de_emision: this.formatNubefactDate(sale.saleDate, timezone),
      fecha_de_vencimiento: sale.paymentDueDate ? this.formatNubefactDate(sale.paymentDueDate, timezone) : '',
      moneda: sale.currency === 'USD' ? 2 : 1,
      tipo_de_cambio: '',
      porcentaje_de_igv: 18,
      total_gravada: Number(totalTaxable.toFixed(2)),
      total_exonerada: 0,
      total_inafecta: Number(totalUnaffected.toFixed(2)),
      total_igv: Number(sale.taxAmount),
      total_gratuita: 0,
      total_otros_cargos: 0,
      total_descuentos: Number(sale.discount),
      total: Number(sale.total),
      observaciones: sale.notes ?? '',
      enviar_automaticamente_a_la_sunat: true,
      enviar_automaticamente_al_cliente: false,
      formato_de_pdf: 'A4',
      items,
    };
  }

  private getSeries(settings: PublicSettings, type: ElectronicDocumentType) {
    const key = type.toLowerCase() as 'ticket' | 'boleta' | 'factura';
    const series = settings.billing?.series?.[key]?.trim().toUpperCase();
    if (!series || !/^[A-Z0-9]{1,4}$/.test(series)) {
      throw new BadRequestException(`Configura una serie válida para ${key} en Configuración`);
    }
    return series;
  }

  private getStartingNumber(settings: PublicSettings, type: ElectronicDocumentType) {
    const key = `${type.toLowerCase()}NextNumber` as 'ticketNextNumber' | 'boletaNextNumber' | 'facturaNextNumber';
    const value = settings.billing?.series?.[key];
    const number = Number(value ?? 1);
    if (!Number.isInteger(number) || number < 1) {
      throw new BadRequestException(`El correlativo inicial de ${type.toLowerCase()} debe ser un entero positivo`);
    }
    return number;
  }

  private asPublicSettings(settings: Prisma.JsonValue): PublicSettings {
    return settings && typeof settings === 'object' && !Array.isArray(settings)
      ? settings as PublicSettings
      : {};
  }

  private formatNubefactDate(value: Date, timezone: string) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).formatToParts(value);
    const day = parts.find((part) => part.type === 'day')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const year = parts.find((part) => part.type === 'year')?.value;
    return `${day}-${month}-${year}`;
  }

  private safeProviderMessage(value?: string) {
    return value?.replace(/[\r\n\t]/g, ' ').slice(0, 500) ?? null;
  }

  private safeProviderUrl(value?: string) {
    if (!value) return null;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' ? url.toString() : null;
    } catch {
      return null;
    }
  }

  private async getNubefactIntegration(organizationId: string) {
    const integration = await this.prisma.organizationIntegration.findUnique({
      where: { organizationId_provider: { organizationId, provider: 'NUBEFACT' } },
    });
    if (!integration) return null;
    return { ...integration, decryptedToken: this.decryptToken(integration.encryptedToken) };
  }

  private validateNubefactEndpoint(value: string) {
    let endpoint: URL;
    try { endpoint = new URL(value); }
    catch { throw new BadRequestException('La ruta Nubefact no es una URL válida'); }
    if (endpoint.protocol !== 'https:' || !['api.nubefact.com', 'api.pse.pe'].includes(endpoint.hostname)) {
      throw new BadRequestException('Usa la URL HTTPS exacta de API Nubefact o del entorno demo de PSE');
    }
    if (endpoint.username || endpoint.password) throw new BadRequestException('La URL no debe contener credenciales');
    return endpoint;
  }

  private postToNubefact(endpointUrl: string, token: string, payload: Record<string, unknown>, authStyle: 'Bearer' | 'Token') {
    return fetch(endpointUrl, {
      method: 'POST',
      headers: {
        Authorization: authStyle === 'Bearer' ? `Bearer ${token}` : `Token token="${token}"`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });
  }

  private encryptToken(token: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.getEncryptionKey(true)!, iv);
    const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
    return `v1:${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
  }

  private decryptToken(value: string) {
    const [version, ivHex, tagHex, encryptedHex] = value.split(':');
    if (version !== 'v1' || !ivHex || !tagHex || !encryptedHex) {
      throw new ServiceUnavailableException('No se pudo descifrar la configuración Nubefact');
    }
    try {
      const decipher = createDecipheriv('aes-256-gcm', this.getEncryptionKey(true)!, Buffer.from(ivHex, 'hex'));
      decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
      return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString('utf8');
    } catch {
      throw new ServiceUnavailableException('No se pudo descifrar la configuración Nubefact');
    }
  }

  private getEncryptionKey(required: boolean) {
    const raw = this.config.get<string>('NUBEFACT_ENCRYPTION_KEY');
    if (!raw && !required) return null;
    if (!raw || !/^[a-fA-F0-9]{64}$/.test(raw)) {
      if (!required) return null;
      throw new ServiceUnavailableException('Configura NUBEFACT_ENCRYPTION_KEY con 64 caracteres hexadecimales antes de guardar el token');
    }
    return Buffer.from(raw, 'hex');
  }
}