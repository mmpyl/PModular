import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PseProvider, PseProviderResponse, PseProviderStatus, InvoiceData } from '../interfaces/pse-provider.interface';

/**
 * Proveedor Facturador SUNAT - Solución gratuita oficial
 * 
 * Características:
 * - Costo: GRATUITO (servicio oficial de SUNAT)
 * - API SOAP más compleja
 * - Soporta facturas, boletas, notas de crédito/débito
 * - Tiempo de respuesta promedio: 3-8 segundos
 * - Requiere certificado digital y configuración más elaborada
 * - Documentación: https://www.sunat.gob.pe/orientacion/electronica/servicios.html
 */
@Injectable()
export class SunatProvider implements PseProvider {
  private readonly logger = new Logger(SunatProvider.name);
  private readonly ruc: string;
  private readonly user: string;
  private readonly password: string;
  private readonly certPath: string;
  private readonly environment: 'SOL' | 'BETA';

  constructor(private configService: ConfigService) {
    this.ruc = this.configService.get<string>('SUNAT_RUC') || '';
    this.user = this.configService.get<string>('SUNAT_USER') || '';
    this.password = this.configService.get<string>('SUNAT_PASSWORD') || '';
    this.certPath = this.configService.get<string>('SUNAT_CERT_PATH') || '';
    this.environment = (this.configService.get<string>('SUNAT_ENV') as 'SOL' | 'BETA') || 'BETA';
  }

  /**
   * Envía un comprobante electrónico directamente a SUNAT
   */
  async sendInvoice(invoiceData: InvoiceData): Promise<PseProviderResponse> {
    try {
      this.logger.log(`Enviando ${invoiceData.type} ${invoiceData.series}-${invoiceData.number} a SUNAT`);

      // Generar XML UBL 2.1
      const xmlContent = this.generateUBLXML(invoiceData);

      // Firmar XML con certificado digital
      const signedXML = await this.signXML(xmlContent);

      // Enviar a SUNAT mediante SOAP
      const response = await this.sendToSunatSOAP(signedXML, invoiceData.type);

      if (response.success) {
        return {
          success: true,
          ticket: response.ticket,
          status: response.status === '0' ? 'ACCEPTED' : 'REJECTED',
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          hash: response.hash,
          qrCode: this.generateQRCode(invoiceData, response),
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
      this.logger.error(`Error enviando comprobante a SUNAT: ${error.message}`);
      return {
        success: false,
        errors: [{
          code: 'SUNAT_ERROR',
          message: error.message || 'Error desconocido al enviar a SUNAT',
        }],
      };
    }
  }

  /**
   * Consulta el estado de un comprobante en SUNAT
   */
  async checkStatus(documentType: string, documentNumber: string): Promise<PseProviderStatus> {
    try {
      // SUNAT no tiene endpoint directo de consulta, se debe usar el CDR
      const cdr = await this.getCDR(documentType, documentNumber);
      
      if (cdr) {
        return {
          status: 'ACCEPTED',
          cdrAvailable: true,
        };
      } else {
        return {
          status: 'NOT_FOUND',
          cdrAvailable: false,
        };
      }
    } catch (error) {
      this.logger.error(`Error consultando estado en SUNAT: ${error.message}`);
      return {
        status: 'NOT_FOUND',
        cdrAvailable: false,
      };
    }
  }

  /**
   * Obtiene el CDR desde SUNAT
   */
  async getCDR(documentType: string, documentNumber: string): Promise<string | null> {
    try {
      this.logger.log(`Consultando CDR para ${documentType}-${documentNumber}`);
      
      // Construir nombre del archivo CDR esperado
      const cdrFilename = `R-${documentType}-${documentNumber}.xml`;
      
      // Consultar servicio SOAP de SUNAT para obtener CDR
      const response = await this.getCDRFromSunat(cdrFilename);
      
      return response?.cdrBase64 || null;
    } catch (error) {
      this.logger.error(`Error obteniendo CDR de SUNAT: ${error.message}`);
      return null;
    }
  }

  /**
   * Anula un comprobante en SUNAT mediante nota de crédito
   */
  async cancelInvoice(documentType: string, documentNumber: string, reason: string): Promise<PseProviderResponse> {
    try {
      this.logger.log(`Anulando ${documentType} ${documentNumber} en SUNAT. Razón: ${reason}`);

      // Para anular en SUNAT se debe crear una Nota de Crédito
      const creditNoteData: InvoiceData = {
        invoiceId: `NC-${documentNumber}`,
        organizationId: '', // Se obtendrá de configuración
        type: 'NOTA_CREDITO',
        series: documentType === 'FACTURA' ? 'F001' : 'B001',
        number: this.generateNextNumber(documentType),
        issueDate: new Date(),
        customer: {
          documentType: 'RUC',
          documentNumber: this.ruc,
          name: 'ANULACION',
        },
        items: [],
        totals: {
          subtotal: 0,
          totalDiscounts: 0,
          totalTax: 0,
          total: 0,
        },
        relatedDocument: {
          type: documentType as 'FACTURA' | 'BOLETA',
          series: documentType === 'FACTURA' ? 'F001' : 'B001',
          number: documentNumber,
          issueDate: new Date(),
          reason: reason,
        },
      };

      // Enviar nota de crédito de anulación
      return await this.sendInvoice(creditNoteData);
    } catch (error) {
      this.logger.error(`Error anulando comprobante en SUNAT: ${error.message}`);
      return {
        success: false,
        errors: [{
          code: 'SUNAT_CANCEL_ERROR',
          message: error.message || 'Error al anular comprobante',
        }],
      };
    }
  }

  /**
   * Valida las credenciales de SUNAT
   */
  async validateCredentials(): Promise<boolean> {
    try {
      // Verificar que existan las credenciales básicas
      if (!this.ruc || !this.user || !this.password) {
        this.logger.warn('Faltan credenciales de SUNAT configuradas');
        return false;
      }

      // Verificar que exista el certificado digital
      // En producción validar que el archivo exista y sea válido
      if (!this.certPath) {
        this.logger.warn('No hay certificado digital configurado');
        return false;
      }

      // Intentar conexión básica al servicio de SUNAT
      const testConnection = await this.testSunatConnection();
      return testConnection;
    } catch (error) {
      this.logger.error(`Credenciales de SUNAT inválidas: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtiene el nombre del proveedor
   */
  getProviderName(): string {
    return 'SUNAT Directo';
  }

  /**
   * Genera XML en formato UBL 2.1 para SUNAT
   */
  private generateUBLXML(invoiceData: InvoiceData): string {
    // Implementación simplificada - en producción usar librería como xmlbuilder2
    this.logger.debug('Generando XML UBL 2.1');
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <!-- Implementación completa de UBL 2.1 requerida -->
  <!-- Este es un ejemplo simplificado -->
</Invoice>`;
    
    return xml;
  }

  /**
   * Firma el XML usando el certificado digital
   */
  private async signXML(xmlContent: string): Promise<string> {
    this.logger.debug('Firmando XML con certificado digital');
    
    // En producción usar librería como xmldsig o node-forge
    // para firmar el XML con el certificado .pfx
    
    // Mock para desarrollo
    return xmlContent.replace('</Invoice>', '<Signature>MOCK_SIGNATURE</Signature></Invoice>');
  }

  /**
   * Envía el XML firmado a SUNAT mediante SOAP
   */
  private async sendToSunatSOAP(signedXML: string, documentType: string): Promise<any> {
    this.logger.debug('Enviando a SUNAT vía SOAP');
    
    // Determinar endpoint según ambiente
    const endpoint = this.environment === 'SOL' 
      ? 'https://e-factura.sunat.gob.pe/ol-it-wsconscpegem/billConsultService'
      : 'https://e-beta.sunat.gob.pe/ol-ti-itiemsgemm-beta/billService';

    // Construir mensaje SOAP
    const soapBody = this.buildSOAPMessage(signedXML);

    // Mock de respuesta - en producción usar axios con cliente SOAP
    return {
      success: true,
      ticket: 'T-' + Date.now(),
      status: '0',
      statusCode: '0',
      statusMessage: 'Comprobante aceptado',
      hash: 'sunat-hash-' + Date.now(),
    };
  }

  /**
   * Construye mensaje SOAP para SUNAT
   */
  private buildSOAPMessage(xmlContent: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Header/>
  <soapenv:Body>
    <!-- Mensaje SOAP para SUNAT -->
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  /**
   * Obtiene CDR desde SUNAT
   */
  private async getCDRFromSunat(cdrFilename: string): Promise<any> {
    // Mock de respuesta
    return {
      cdrBase64: 'base64-encoded-cdr-content',
    };
  }

  /**
   * Prueba conexión con SUNAT
   */
  private async testSunatConnection(): Promise<boolean> {
    // Mock - en producción hacer ping real al servicio
    return true;
  }

  /**
   * Genera código QR para el comprobante
   */
  private generateQRCode(invoiceData: InvoiceData, response: any): string {
    // Formato QR según especificación SUNAT
    // RUC|TIPO_DOC|SERIE|NUMERO|MONTO_TOTAL|Monto_IVA|FECHA_EMISION|TIPO_DOC_CLIENTE|NUMERO_DOC_CLIENTE
    const qrData = [
      this.ruc,
      this.mapDocumentTypeToCode(invoiceData.type),
      invoiceData.series,
      invoiceData.number,
      invoiceData.totals.total.toFixed(2),
      invoiceData.totals.totalTax.toFixed(2),
      invoiceData.issueDate.toISOString().split('T')[0],
      '1', // Tipo doc cliente default
      invoiceData.customer.documentNumber,
    ].join('|');

    return qrData;
  }

  /**
   * Mapea tipo de documento a código numérico
   */
  private mapDocumentTypeToCode(type: string): string {
    const typeMap: Record<string, string> = {
      'FACTURA': '01',
      'BOLETA': '03',
      'NOTA_CREDITO': '07',
      'NOTA_DEBITO': '08',
    };
    return typeMap[type] || '01';
  }

  /**
   * Genera siguiente número para nota de crédito
   */
  private generateNextNumber(documentType: string): string {
    // En producción consultar último número usado
    return String(Date.now()).slice(-8);
  }
}
