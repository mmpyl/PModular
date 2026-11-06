import { InvoiceType, InvoiceStatus } from '@prisma/client';

/**
 * Interfaz común para proveedores PSE/OSE
 * Define los métodos que todo proveedor debe implementar
 */
export interface PseProvider {
  /**
   * Envía un comprobante electrónico a SUNAT
   */
  sendInvoice(payload: SendInvoicePayload): Promise<SendInvoiceResponse>;

  /**
   * Consulta el estado de un comprobante
   */
  checkStatus(ruc: string, tipoComprobante: string, serie: string, correlativo: number): Promise<StatusResponse>;

  /**
   * Obtiene la Constancia de Recepción (CDR)
   */
  getCDR(ruc: string, tipoComprobante: string, serie: string, correlativo: number): Promise<CDRResponse>;

  /**
   * Anula un comprobante electrónico
   */
  cancelInvoice(payload: CancelInvoicePayload): Promise<CancelInvoiceResponse>;

  /**
   * Valida las credenciales del proveedor
   */
  validateCredentials(): Promise<boolean>;
}

export interface SendInvoicePayload {
  organizationId: string;
  ruc: string;
  tipoComprobante: InvoiceType;
  serie: string;
  correlativo: string;
  fechaEmision: string; // ISO format
  cliente: {
    nombre: string;
    documento: string;
    direccion?: string;
  };
  items: InvoiceItem[];
  totales: {
    subtotal: number;
    igv: number;
    descuento?: number;
    total: number;
  };
  guiaRemision?: string;
  ordenCompra?: string;
  observaciones?: string;
}

export interface InvoiceItem {
  numeroItem: number;
  codigoProducto?: string;
  descripcion: string;
  cantidad: number;
  unidadMedida: string;
  precioUnitario: number;
  valorUnitario: number;
  igv: number;
  importeTotal: number;
}

export interface SendInvoiceResponse {
  success: boolean;
  cdr?: {
    codigoRespuesta: string;
    mensaje: string;
    hash: string;
    xmlContent?: string;
  };
  ticket?: string; // Ticket de envío
  error?: string;
}

export interface StatusResponse {
  success: boolean;
  estado: InvoiceStatus | string;
  codigoRespuesta?: string;
  mensaje?: string;
}

export interface CDRResponse {
  success: boolean;
  cdrXml?: string;
  hash?: string;
  codigoRespuesta?: string;
  mensaje?: string;
  error?: string;
}

export interface CancelInvoicePayload {
  organizationId: string;
  ruc: string;
  tipoComprobante: string;
  serie: string;
  correlativo: string;
  motivoAnulacion: string;
  tipoDocumentoSustento: string; // Tipo de documento que sustenta la anulación
  numeroDocumentoSustento: string;
}

export interface CancelInvoiceResponse {
  success: boolean;
  cdr?: {
    codigoRespuesta: string;
    mensaje: string;
    hash: string;
  };
  error?: string;
}

export enum PseProviderType {
  NUBEFACT = 'NUBEFACT',
  SUNAT_DIRECTO = 'SUNAT_DIRECTO',
  SOLUCION_FACTIBLE = 'SOLUCION_FACTIBLE',
}
