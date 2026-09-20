export declare enum SaleStatus {
    BORRADOR = "BORRADOR",
    CONFIRMADA = "CONFIRMADA",
    EN_PROCESO = "EN_PROCESO",
    COMPLETADA = "COMPLETADA",
    CANCELADA = "CANCELADA",
    DEVUELTA_PARCIAL = "DEVUELTA_PARCIAL",
    DEVUELTA_TOTAL = "DEVUELTA_TOTAL"
}
export declare enum SaleType {
    VENTA_MOSTRADOR = "VENTA_MOSTRADOR",
    PEDIDO = "PEDIDO",
    RESERVA = "RESERVA",
    ENTREGA_DOMICILIO = "ENTREGA_DOMICILIO"
}
export declare enum PaymentTerm {
    CONTADO = "CONTADO",
    CREDITO_7_DIAS = "CREDITO_7_DIAS",
    CREDITO_15_DIAS = "CREDITO_15_DIAS",
    CREDITO_30_DIAS = "CREDITO_30_DIAS",
    CREDITO_60_DIAS = "CREDITO_60_DIAS",
    CREDITO_90_DIAS = "CREDITO_90_DIAS",
    PERSONALIZADO = "PERSONALIZADO"
}
export declare class SaleItemDto {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxRate?: number;
    batchId?: string;
    notes?: string;
}
export declare class CreateSaleDto {
    customerId?: string;
    type?: SaleType;
    status?: SaleStatus;
    deliveryDate?: string;
    paymentTerm?: PaymentTerm;
    paymentDueDate?: string;
    discount?: number;
    taxRate?: number;
    currency?: string;
    notes?: string;
    internalNotes?: string;
    items: SaleItemDto[];
}
export declare class UpdateSaleDto {
    status?: SaleStatus;
    customerId?: string;
    type?: SaleType;
    deliveryDate?: string;
    paymentTerm?: PaymentTerm;
    paymentDueDate?: string;
    discount?: number;
    taxRate?: number;
    currency?: string;
    notes?: string;
    internalNotes?: string;
}
export declare class ProcessPaymentDto {
    amount: number;
    method: string;
    transactionId?: string;
    bankName?: string;
    cardLastFour?: string;
    notes?: string;
}
