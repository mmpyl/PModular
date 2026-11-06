import { Injectable, Logger } from '@nestjs/common';
import {
  PseProvider,
  SendInvoicePayload,
  SendInvoiceResponse,
  StatusResponse,
  CDRResponse,
  CancelInvoicePayload,
  CancelInvoiceResponse,
} from '../interfaces/pse-provider.interface';

/**
 * Proveedor Nubefact - PSE recomendado para inicio
 * API REST sencilla, sin necesidad de certificado digital propio
 */
@Injectable()
export class NubefactProvider implements PseProvider {
  private readonly logger = new Logger(NubefactProvider.name);
  private readonly baseUrl: string;
  private readonly apiToken: string;

  constructor() {
    // En producción, estas credenciales vienen de OrganizationFiscalSettings
    this.baseUrl = process.env.NUBEFACT_BASE_URL || 'https://nubefact.com/api/v1';
    this.apiToken = process.env.NUBEFACT_API_TOKEN || '';
  }

  /**
   * Envía un comprobante electrónico usando la API de Nubefact
   */
  async sendInvoice(payload: SendInvoicePayload): Promise<SendInvoiceResponse> {
    try {
      this.logger.log(`Enviando ${payload.tipoComprobante} ${payload.serie}-${payload.correlativo} a Nubefact`);

      // Transformar payload al formato de Nubefact
      const nubefactPayload = this.transformToNubefactFormat(payload);

      // Simulación de llamada API (en producción usar HttpModule)
      // const response = await this.httpService.post(`${this.baseUrl}/invoices`, nubefactPayload).toPromise();
      
      // Respuesta simulada exitosa
      return {
        success: true,
        cdr: {
          codigoRespuesta: '0',
          mensaje: 'Comprobante aceptado correctamente',
          hash: `cdr-${payload.serie}-${payload.correlativo}-${Date.now()}`,
          xmlContent: '<?xml version="1.0"?><ApplicationResponse>...</ApplicationResponse>',
        },
        ticket: `T-${payload.serie}-${payload.correlativo}`,
      };
    } catch (error) {
      this.logger.error('Error enviando comprobante a Nubefact', error);
      return {
        success: false,
        error: error.message || 'Error desconocido al enviar a Nubefact',
      };
    }
  }

  /**
   * Consulta el estado de un comprobante en Nubefact
   */
  async checkStatus(
    ruc: string,
    tipoComprobante: string,
    serie: string,
    correlativo: number,
  ): Promise<StatusResponse> {
    try {
      this.logger.log(`Consultando estado: ${ruc}-${tipoComprobante}-${serie}-${correlativo}`);

      // Simulación de respuesta
      return {
        success: true,
        estado: 'ACEPTADO',
        codigoRespuesta: '0',
        mensaje: 'Comprobante aceptado por SUNAT',
      };
    } catch (error) {
      this.logger.error('Error consultando estado', error);
      return {
        success: false,
        estado: 'ERROR',
        mensaje: error.message,
      };
    }
  }

  /**
   * Obtiene el CDR desde Nubefact
   */
  async getCDR(
    ruc: string,
    tipoComprobante: string,
    serie: string,
    correlativo: number,
  ): Promise<CDRResponse> {
    try {
      this.logger.log(`Obteniendo CDR: ${ruc}-${tipoComprobante}-${serie}-${correlativo}`);

      // Simulación de respuesta
      return {
        success: true,
        cdrXml: '<?xml version="1.0"?><ApplicationResponse>CDR Content</ApplicationResponse>',
        hash: `cdr-hash-${Date.now()}`,
        codigoRespuesta: '0',
        mensaje: 'CDR obtenido exitosamente',
      };
    } catch (error) {
      this.logger.error('Error obteniendo CDR', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Anula un comprobante mediante nota de crédito/debito
   */
  async cancelInvoice(payload: CancelInvoicePayload): Promise<CancelInvoiceResponse> {
    try {
      this.logger.log(`Anulando comprobante: ${payload.serie}-${payload.correlativo}`);

      // Nubefact requiere crear una nota de crédito/débito para anular
      const cancelPayload = {
        tipo_comprobante: payload.tipoComprobante === 'FACTURA' ? '01' : 
                         payload.tipoComprobante === 'BOLETA' ? '03' : '01',
        serie: payload.serie,
        numero: payload.correlativo,
        motivo: payload.motivoAnulacion,
        documento_sustento: {
          tipo: payload.tipoDocumentoSustento,
          numero: payload.numeroDocumentoSustento,
        },
      };

      // Simulación de anulación exitosa
      return {
        success: true,
        cdr: {
          codigoRespuesta: '0',
          mensaje: 'Comprobante anulado correctamente',
          hash: `cancel-hash-${Date.now()}`,
        },
      };
    } catch (error) {
      this.logger.error('Error anulando comprobante', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Valida las credenciales de Nubefact
   */
  async validateCredentials(): Promise<boolean> {
    try {
      if (!this.apiToken) {
        return false;
      }

      // Simulación de validación
      // En producción: hacer request a endpoint de test
      return true;
    } catch (error) {
      this.logger.error('Error validando credenciales Nubefact', error);
      return false;
    }
  }

  /**
   * Transforma el payload genérico al formato específico de Nubefact
   */
  private transformToNubefactFormat(payload: SendInvoicePayload): any {
    // Mapeo de tipos de comprobante a códigos SUNAT
    const tipoComprobanteMap = {
      FACTURA: '01',
      BOLETA: '03',
      NOTA_CREDITO: '07',
      NOTA_DEBITO: '08',
    };

    return {
      tipo_documento: tipoComprobanteMap[payload.tipoComprobante],
      cliente_tipo_documento: payload.cliente.documento.length === 11 ? '6' : '1', // 6=RUC, 1=DNI
      cliente_numero_documento: payload.cliente.documento,
      cliente_denominacion: payload.cliente.nombre,
      cliente_direccion: payload.cliente.direccion || '',
      serie: payload.serie,
      numero: payload.correlativo,
      fecha_emision: payload.fechaEmision.split('T')[0], // YYYY-MM-DD
      items: payload.items.map((item, index) => ({
        unidad: item.unidadMedida,
        cantidad: item.cantidad,
        descripcion: item.descripcion,
        precio_unitario: item.precioUnitario,
        descuento: item.importeTotal - (item.valorUnitario * item.cantidad),
        valor_unitario: item.valorUnitario,
        igv_unitario: item.igv,
        importe_total: item.importeTotal,
      })),
      sub_total: payload.totales.subtotal,
      total_igv: payload.totales.igv,
      descuento_global: payload.totales.descuento || 0,
      total: payload.totales.total,
      observaciones: payload.observaciones,
    };
  }
}
