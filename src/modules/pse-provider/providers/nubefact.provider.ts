import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PseProvider, PseProviderResponse, PseProviderStatus, InvoiceData } from '../interfaces/pse-provider.interface';

/**
 * Proveedor Nubefact - OSE popular en Perú
 * 
 * Características:
 * - Costo: ~$0.03-0.05 por comprobante (varía según plan)
 * - API REST moderna y bien documentada
 * - Soporta facturas, boletas, notas de crédito/débito
 * - Tiempo de respuesta promedio: 1-3 segundos
 * - Soporte técnico en español
 * - Documentación: https://app.nubefact.com/docs/api/
 */
@Injectable()
export class NubefactProvider implements PseProvider {
  private readonly logger = new Logger(NubefactProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('NUBEFACT_API_KEY') || '';
    this.baseUrl = this.configService.get<string>('NUBEFACT_BASE_URL') || 'https://nubefact.com/api/v1';
  }

  /**
   * Envía un comprobante electrónico a Nubefact
   */
  async sendInvoice(invoiceData: InvoiceData): Promise<PseProviderResponse> {
    try {
      this.logger.log(`Enviando ${invoiceData.type} ${invoiceData.series}-${invoiceData.number} a Nubefact`);

      // Transformar datos al formato de Nubefact
      const payload = this.transformToNubefactFormat(invoiceData);

      // Hacer petición HTTP a la API de Nubefact
      // Nota: En producción usar axios o http module de NestJS
      const response = await this.makeHttpRequest('/send', payload);

      if (response.success) {
        return {
          success: true,
          ticket: response.ticket,
          cdrTicket: response.cdr_ticket,
          status: response.status === '1' ? 'ACCEPTED' : 'REJECTED',
          statusCode: response.codigo_sunat,
          statusMessage: response.mensaje_sunat,
          hash: response.hash,
          qrCode: response.cadena_para_codigo_qr,
          rawResponse: response,
        };
      } else {
        return {
          success: false,
          errors: response.errors?.map((err: any) => ({
            code: err.code,
            message: err.message,
          })),
          rawResponse: response,
        };
      }
    } catch (error) {
      this.logger.error(`Error enviando comprobante a Nubefact: ${error.message}`);
      return {
        success: false,
        errors: [{
          code: 'NUBEFACT_ERROR',
          message: error.message || 'Error desconocido al enviar a Nubefact',
        }],
      };
    }
  }

  /**
   * Consulta el estado de un comprobante en Nubefact
   */
  async checkStatus(documentType: string, documentNumber: string): Promise<PseProviderStatus> {
    try {
      const response = await this.makeHttpRequest('/consultar_comprobante', {
        tipo_documento: documentType,
        numero_documento: documentNumber,
      });

      return {
        status: response.estado === '1' ? 'ACCEPTED' : 'REJECTED',
        statusCode: response.codigo_sunat,
        statusMessage: response.mensaje_sunat,
        sentDate: response.fecha_emision ? new Date(response.fecha_emision) : undefined,
        receivedDate: response.fecha_recepcion ? new Date(response.fecha_recepcion) : undefined,
        hash: response.hash,
        cdrAvailable: response.cdr_disponible === '1',
      };
    } catch (error) {
      this.logger.error(`Error consultando estado en Nubefact: ${error.message}`);
      return {
        status: 'NOT_FOUND',
        cdrAvailable: false,
      };
    }
  }

  /**
   * Obtiene el CDR (Constancia de Recepción) desde Nubefact
   */
  async getCDR(documentType: string, documentNumber: string): Promise<string | null> {
    try {
      const response = await this.makeHttpRequest('/descargar_cdr', {
        tipo_documento: documentType,
        numero_documento: documentNumber,
      });

      return response.cdr_base64 || null;
    } catch (error) {
      this.logger.error(`Error obteniendo CDR de Nubefact: ${error.message}`);
      return null;
    }
  }

  /**
   * Anula un comprobante en Nubefact
   */
  async cancelInvoice(documentType: string, documentNumber: string, reason: string): Promise<PseProviderResponse> {
    try {
      this.logger.log(`Anulando ${documentType} ${documentNumber} en Nubefact. Razón: ${reason}`);

      const response = await this.makeHttpRequest('/anular_comprobante', {
        tipo_documento: documentType,
        numero_documento: documentNumber,
        motivo: reason,
      });

      return {
        success: response.success,
        status: response.success ? 'ACCEPTED' : 'REJECTED',
        statusMessage: response.mensaje,
        rawResponse: response,
      };
    } catch (error) {
      this.logger.error(`Error anulando comprobante en Nubefact: ${error.message}`);
      return {
        success: false,
        errors: [{
          code: 'NUBEFACT_CANCEL_ERROR',
          message: error.message || 'Error al anular comprobante',
        }],
      };
    }
  }

  /**
   * Valida las credenciales de Nubefact
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeHttpRequest('/prueba', {});
      return response.success === true;
    } catch (error) {
      this.logger.error(`Credenciales de Nubefact inválidas: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtiene el nombre del proveedor
   */
  getProviderName(): string {
    return 'Nubefact';
  }

  /**
   * Transforma los datos del comprobante al formato esperado por Nubefact
   */
  private transformToNubefactFormat(invoiceData: InvoiceData): any {
    return {
      cliente: invoiceData.customer.documentNumber,
      tipo_documento: this.mapDocumentType(invoiceData.type),
      serie: invoiceData.series,
      numero: invoiceData.number,
      fecha_emision: invoiceData.issueDate.toISOString().split('T')[0],
      items: invoiceData.items.map(item => ({
        codigo_interno: item.itemCode,
        descripcion: item.description,
        cantidad: item.quantity,
        valor_unitario: item.unitPrice,
        precio_unitario: item.unitPrice + (item.taxAmount / item.quantity),
        descuento: item.discountAmount || 0,
        total: item.totalPrice,
      })),
      total_gravada: invoiceData.totals.subtotal,
      total_igv: invoiceData.totals.totalTax,
      total: invoiceData.totals.total,
      observaciones: invoiceData.observations,
    };
  }

  /**
   * Mapea el tipo de documento al formato de Nubefact
   */
  private mapDocumentType(type: string): string {
    const typeMap: Record<string, string> = {
      'FACTURA': '01',
      'BOLETA': '03',
      'NOTA_CREDITO': '07',
      'NOTA_DEBITO': '08',
    };
    return typeMap[type] || type;
  }

  /**
   * Realiza una petición HTTP a la API de Nubefact
   * Nota: Implementación simplificada - usar axios en producción
   */
  private async makeHttpRequest(endpoint: string, payload: any): Promise<any> {
    // Simulación de llamada HTTP - reemplazar con implementación real usando axios
    // Ejemplo con axios:
    // const response = await axios.post(`${this.baseUrl}${endpoint}`, payload, {
    //   headers: {
    //     'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
    //     'Content-Type': 'application/json',
    //   },
    // });
    // return response.data;

    // Mock para desarrollo
    this.logger.debug(`HTTP POST ${this.baseUrl}${endpoint}`, JSON.stringify(payload));
    
    // Retornar mock response para pruebas
    return {
      success: true,
      ticket: 'T-' + Date.now(),
      cdr_ticket: 'C-' + Date.now(),
      status: '1',
      codigo_sunat: '0',
      mensaje_sunat: 'Comprobante aceptado',
      hash: 'mock-hash-' + Date.now(),
      cadena_para_codigo_qr: 'mock-qr-code',
    };
  }
}
