/**
 * Interfaz base para proveedores PSE/OSE
 * Define el contrato que deben implementar todos los proveedores
 */
export interface PseProvider {
  /**
   * Envía un comprobante electrónico al proveedor PSE/OSE
   */
  sendInvoice(invoiceData: InvoiceData): Promise<PseProviderResponse>;

  /**
   * Consulta el estado de un comprobante ya enviado
   */
  checkStatus(documentType: string, documentNumber: string): Promise<PseProviderStatus>;

  /**
   * Consulta el estado de un comprobante usando el CDR (Constancia de Recepción)
   */
  getCDR(documentType: string, documentNumber: string): Promise<string | null>;

  /**
   * Anula un comprobante electrónico
   */
  cancelInvoice(documentType: string, documentNumber: string, reason: string): Promise<PseProviderResponse>;

  /**
   * Valida las credenciales del proveedor
   */
  validateCredentials(): Promise<boolean>;

  /**
   * Obtiene el nombre del proveedor
   */
  getProviderName(): string;
}

/**
 * Datos del comprobante a enviar
 */
export interface InvoiceData {
  invoiceId: string;
  organizationId: string;
  type: 'FACTURA' | 'BOLETA' | 'NOTA_CREDITO' | 'NOTA_DEBITO';
  series: string;
  number: string;
  issueDate: Date;
  dueDate?: Date;
  customer: CustomerData;
  items: InvoiceItem[];
  totals: InvoiceTotals;
  observations?: string;
  relatedDocument?: RelatedDocumentData; // Para notas de crédito/débito
}

/**
 * Datos del cliente
 */
export interface CustomerData {
  documentType: 'RUC' | 'DNI' | 'CE' | 'OTHER';
  documentNumber: string;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
}

/**
 * Ítem del comprobante
 */
export interface InvoiceItem {
  itemCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxAmount: number;
  taxRate: number;
  discountAmount?: number;
}

/**
 * Totales del comprobante
 */
export interface InvoiceTotals {
  subtotal: number;
  totalDiscounts: number;
  totalTax: number;
  total: number;
}

/**
 * Documento relacionado (para notas de crédito/débito)
 */
export interface RelatedDocumentData {
  type: 'FACTURA' | 'BOLETA';
  series: string;
  number: string;
  issueDate: Date;
  reason?: string;
}

/**
 * Respuesta del proveedor PSE/OSE
 */
export interface PseProviderResponse {
  success: boolean;
  ticket?: string; // Ticket de envío
  cdrTicket?: string; // Ticket para obtener CDR
  status?: 'ACCEPTED' | 'REJECTED' | 'PENDING';
  statusCode?: string; // Código de respuesta de SUNAT
  statusMessage?: string; // Mensaje de respuesta
  hash?: string; // Hash del comprobante
  qrCode?: string; // Código QR generado
  errors?: ProviderError[];
  rawResponse?: any; // Respuesta cruda del proveedor
}

/**
 * Estado del comprobante en el proveedor
 */
export interface PseProviderStatus {
  status: 'ACCEPTED' | 'REJECTED' | 'PENDING' | 'NOT_FOUND';
  statusCode?: string;
  statusMessage?: string;
  sentDate?: Date;
  receivedDate?: Date;
  hash?: string;
  cdrAvailable: boolean;
}

/**
 * Error del proveedor
 */
export interface ProviderError {
  code: string;
  message: string;
  field?: string;
}
