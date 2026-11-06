import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PseProvider, PseProviderResponse, PseProviderStatus, InvoiceData } from '../interfaces/pse-provider.interface';

/**
 * Proveedor SolucionFactible - OSE alternativo en Perú
 * 
 * Características:
 * - Costo: ~$0.02-0.04 por comprobante (varía según volumen)
 * - API REST simple y directa
 * - Soporta facturas, boletas, notas de crédito/débito, guías de remisión
 * - Tiempo de respuesta promedio: 2-4 segundos
 * - Buena documentación y soporte
 * - Documentación: https://solucionfactible.com/sfe/documentacion/
 */
@Injectable()
export class SolucionFactibleProvider implements PseProvider {
  private readonly logger = new Logger(SolucionFactibleProvider.name);
  private readonly username: string;
  private readonly password: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.username = this.configService.get<string>('SF_USERNAME') || '';
    this.password = this.configService.get<string>('SF_PASSWORD') || '';
    this.baseUrl = this.configService.get<string>('SF_BASE_URL') || 'https://sigfac.sunat.gob.pe';
  }

  /**
   * Envía un comprobante electrónico a Solucion Factible
   */
  async sendInvoice(invoiceData: InvoiceData): Promise<PseProviderResponse> {
    try {
      this.logger.log(`Enviando ${invoiceData.type} ${invoiceData.series}-${invoiceData.number} a Solucion Factible`);

      // Transformar datos al formato de Solucion Factible
      const payload = this.transformToSFFormat(invoiceData);

      // Hacer petición HTTP a la API
      const response = await this.makeHttpRequest('/api/v1/comprobantes', payload);

      if (response.estado === 'ACEPTADO' || response.estado === 'EN_PROCESO') {
        return {
          success: true,
          ticket: response.ticket,
          status: response.estado === 'ACEPTADO' ? 'ACCEPTED' : 'PENDING',
          statusCode: response.codigo_sunat,
          statusMessage: response.mensaje_sunat,
          hash: response.hash,
          qrCode: response.codigo_qr,
          rawResponse: response,
        };
      } else {
        return {
          success: false,
          errors: response.errores?.map((err: any) => ({
            code: err.codigo,
            message: err.descripcion,
          })),
          rawResponse: response,
        };
      }
    } catch (error) {
      this.logger.error(`Error enviando comprobante a Solucion Factible: ${error.message}`);
      return {
        success: false,
        errors: [{
          code: 'SF_ERROR',
          message: error.message || 'Error desconocido al enviar a Solucion Factible',
        }],
      };
    }
  }

  /**
   * Consulta el estado de un comprobante
   */
  async checkStatus(documentType: string, documentNumber: string): Promise<PseProviderStatus> {
    try {
      const response = await this.makeHttpRequest(
        `/api/v1/comprobantes/${documentType}-${documentNumber}/estado`,
        {},
        'GET'
      );

      return {
        status: this.mapEstadoToStatus(response.estado),
        statusCode: response.codigo_sunat,
        statusMessage: response.mensaje_sunat,
        sentDate: response.fecha_emision ? new Date(response.fecha_emision) : undefined,
        receivedDate: response.fecha_recepcion ? new Date(response.fecha_recepcion) : undefined,
        hash: response.hash,
        cdrAvailable: response.cdr_disponible,
      };
    } catch (error) {
      this.logger.error(`Error consultando estado en Solucion Factible: ${error.message}`);
      return {
        status: 'NOT_FOUND',
        cdrAvailable: false,
      };
    }
  }

  /**
   * Obtiene el CDR desde Solucion Factible
   */
  async getCDR(documentType: string, documentNumber: string): Promise<string | null> {
    try {
      const response = await this.makeHttpRequest(
        `/api/v1/comprobantes/${documentType}-${documentNumber}/cdr`,
        {},
        'GET'
      );

      return response.cdr_base64 || null;
    } catch (error) {
      this.logger.error(`Error obteniendo CDR de Solucion Factible: ${error.message}`);
      return null;
    }
  }

  /**
   * Anula un comprobante
   */
  async cancelInvoice(documentType: string, documentNumber: string, reason: string): Promise<PseProviderResponse> {
    try {
      this.logger.log(`Anulando ${documentType} ${documentNumber} en Solucion Factible. Razón: ${reason}`);

      const response = await this.makeHttpRequest(
        `/api/v1/comprobantes/${documentType}-${documentNumber}/anular`,
        { motivo: reason },
        'POST'
      );

      return {
        success: response.exito,
        status: response.exito ? 'ACCEPTED' : 'REJECTED',
        statusMessage: response.mensaje,
        rawResponse: response,
      };
    } catch (error) {
      this.logger.error(`Error anulando comprobante en Solucion Factible: ${error.message}`);
      return {
        success: false,
        errors: [{
          code: 'SF_CANCEL_ERROR',
          message: error.message || 'Error al anular comprobante',
        }],
      };
    }
  }

  /**
   * Valida las credenciales
   */
  async validateCredentials(): Promise<boolean> {
    try {
      if (!this.username || !this.password) {
        this.logger.warn('Faltan credenciales de Solucion Factible');
        return false;
      }

      const response = await this.makeHttpRequest('/api/v1/prueba', {}, 'GET');
      return response.exito === true;
    } catch (error) {
      this.logger.error(`Credenciales de Solucion Factible inválidas: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtiene el nombre del proveedor
   */
  getProviderName(): string {
    return 'Solucion Factible';
  }

  /**
   * Transforma datos al formato de Solucion Factible
   */
  private transformToSFFormat(invoiceData: InvoiceData): any {
    return {
      ruc: invoiceData.customer.documentNumber,
      tipo_comprobante: this.mapDocumentType(invoiceData.type),
      serie: invoiceData.series,
      numero: invoiceData.number,
      fecha_emision: invoiceData.issueDate.toISOString().split('T')[0],
      items: invoiceData.items.map(item => ({
        codigo: item.itemCode,
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
      documento_referencia: invoiceData.relatedDocument ? {
        tipo: this.mapDocumentType(invoiceData.relatedDocument.type),
        serie: invoiceData.relatedDocument.series,
        numero: invoiceData.relatedDocument.number,
        razon: invoiceData.relatedDocument.reason,
      } : undefined,
    };
  }

  /**
   * Mapea tipo de documento
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
   * Mapea estado a enum PseProviderStatus
   */
  private mapEstadoToStatus(estado: string): 'ACCEPTED' | 'REJECTED' | 'PENDING' | 'NOT_FOUND' {
    const statusMap: Record<string, any> = {
      'ACEPTADO': 'ACCEPTED',
      'RECHAZADO': 'REJECTED',
      'EN_PROCESO': 'PENDING',
      'NO_ENCONTRADO': 'NOT_FOUND',
    };
    return statusMap[estado] || 'NOT_FOUND';
  }

  /**
   * Realiza petición HTTP
   */
  private async makeHttpRequest(endpoint: string, payload: any, method: 'GET' | 'POST' = 'POST'): Promise<any> {
    this.logger.debug(`${method} ${this.baseUrl}${endpoint}`, JSON.stringify(payload));
    
    // Mock para desarrollo - en producción usar axios
    return {
      exito: true,
      estado: 'ACEPTADO',
      ticket: 'SF-' + Date.now(),
      codigo_sunat: '0',
      mensaje_sunat: 'Comprobante aceptado',
      hash: 'sf-hash-' + Date.now(),
      codigo_qr: 'mock-qr-sf',
      cdr_disponible: true,
    };
  }
}
