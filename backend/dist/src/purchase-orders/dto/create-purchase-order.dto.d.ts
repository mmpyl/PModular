export declare enum PurchaseOrderStatus {
    BORRADOR = "BORRADOR",
    ENVIADA = "ENVIADA",
    CONFIRMADA = "CONFIRMADA",
    PARCIALMENTE_RECIBIDA = "PARCIALMENTE_RECIBIDA",
    COMPLETADA = "COMPLETADA",
    CANCELADA = "CANCELADA"
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
export declare class PurchaseOrderItemDto {
    productId: string;
    quantityOrdered: number;
    unitCost: number;
    discount?: number;
    taxRate?: number;
    batchNumber?: string;
    expirationDate?: string;
    notes?: string;
}
export declare class CreatePurchaseOrderDto {
    supplierId: string;
    status?: PurchaseOrderStatus;
    expectedDeliveryDate?: string;
    paymentTerm?: PaymentTerm;
    paymentDueDate?: string;
    discount?: number;
    taxRate?: number;
    currency?: string;
    notes?: string;
    internalNotes?: string;
    externalReference?: string;
    items: PurchaseOrderItemDto[];
}
export declare class UpdatePurchaseOrderDto {
    status?: PurchaseOrderStatus;
    supplierId?: string;
    expectedDeliveryDate?: string;
    receivedDate?: string;
    paymentTerm?: PaymentTerm;
    paymentDueDate?: string;
    discount?: number;
    taxRate?: number;
    currency?: string;
    notes?: string;
    internalNotes?: string;
    externalReference?: string;
}
export declare class ReceivePurchaseOrderDto {
    items: ReceiveOrderItemDto[];
    notes?: string;
}
export declare class ReceiveOrderItemDto {
    itemId: string;
    quantityReceived: number;
    batchNumber?: string;
    expirationDate?: string;
}
