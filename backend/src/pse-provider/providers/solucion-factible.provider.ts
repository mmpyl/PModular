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
 * Proveedor Solución Factible - Alternativa económica
 * API REST similar a Nubefact
 */
@Injectable()
export class SolucionFactibleProvider implements PseProvider {
  private readonly logger = new Logger(SolucionFactibleProvider.name);
  private readonly baseUrl: string;
  private readonly apiToken: string;

  constructor() {
    this.baseUrl = process.env.SOLUCION_FACTIBLE_BASE_URL || 'https://api.solucionfactible.com/sf-api/web-api/';
    this.apiToken = process.env.SOLUCION_FACTIBLE_API_TOKEN || '';
  }

  async sendInvoice(payload: SendInvoicePayload): Promise<SendInvoiceResponse> {
    try {
      this.logger.log(`Enviando ${payload.tipoComprobante} ${payload.serie}-${payload.correlativo} a Solución Factible`);

      const sfPayload = this.transformToSFFormat(payload);

      // Simulación de respuesta
      return {
        success: true,
        cdr: {
          codigoRespuesta: '0',
          mensaje: 'Documento procesado exitosamente',
          hash: `sf-${payload.serie}-${payload.correlativo}-${Date.now()}`,
          xmlContent: '<?xml version="1.0"?><ApplicationResponse>SF CDR</ApplicationResponse>',
        },
        ticket: `SF-${payload.serie}-${payload.correlativo}`,
      };
    } catch (error) {
      this.logger.error('Error enviando comprobante a Solución Factible', error);
      return {
        success: false,
        error: error.message || 'Error al enviar a Solución Factible',
      };
    }
  }

  async checkStatus(
    ruc: string,
    tipoComprobante: string,
    serie: string,
    correlativo: number,
  ): Promise<StatusResponse> {
    try {
      this.logger.log(`Consultando estado SF: ${ruc}-${tipoComprobante}-${serie}-${correlativo}`);

      return {
        success: true,
        estado: 'ACEPTADO',
        codigoRespuesta: '0',
        mensaje: 'Documento aceptado',
      };
    } catch (error) {
      this.logger.error('Error consultando estado SF', error);
      return {
        success: false,
        estado: 'ERROR',
        mensaje: error.message,
      };
    }
  }

  async getCDR(
    ruc: string,
    tipoComprobante: string,
    serie: string,
    correlativo: number,
  ): Promise<CDRResponse> {
    try {
      this.logger.log(`Obteniendo CDR SF: ${ruc}-${tipoComprobante}-${serie}-${correlativo}`);

      return {
        success: true,
        cdrXml: '<?xml version="1.0"?><ApplicationResponse>SF CDR</ApplicationResponse>',
        hash: `sf-cdr-${Date.now()}`,
        codigoRespuesta: '0',
        mensaje: 'CDR obtenido',
      };
    } catch (error) {
      this.logger.error('Error obteniendo CDR SF', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async cancelInvoice(payload: CancelInvoicePayload): Promise<CancelInvoiceResponse> {
    try {
      this.logger.log(`Anulando comprobante SF: ${payload.serie}-${payload.correlativo}`);

      return {
        success: true,
        cdr: {
          codigoRespuesta: '0',
          mensaje: 'Anulación procesada',
          hash: `sf-cancel-${Date.now()}`,
        },
      };
    } catch (error) {
      this.logger.error('Error anulando comprobante SF', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      if (!this.apiToken) {
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error('Error validando credenciales SF', error);
      return false;
    }
  }

  private transformToSFFormat(payload: SendInvoicePayload): any {
    const tipoComprobanteMap = {
      FACTURA: '01',
      BOLETA: '03',
      NOTA_CREDITO: '07',
      NOTA_DEBITO: '08',
    };

    return {
      cod_doc: tipoComprobanteMap[payload.tipoComprobante],
      serie: payload.serie,
      numero: payload.correlativo,
      fch_emision: payload.fechaEmision.split('T')[0],
      cliente: {
        tip_doc: payload.cliente.documento.length === 11 ? '6' : '1',
        num_doc: payload.cliente.documento,
        nombre: payload.cliente.nombre,
        direccion: payload.cliente.direccion,
      },
      items: payload.items.map(item => ({
        cantidad: item.cantidad,
        descripcion: item.descripcion,
        precio_unitario: item.precioUnitario,
        valor_unitario: item.valorUnitario,
        igv: item.igv,
        total: item.importeTotal,
      })),
      sub_total: payload.totales.subtotal,
      igv: payload.totales.igv,
      total: payload.totales.total,
    };
  }
}
