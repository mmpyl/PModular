export declare enum CashRegisterStatusDto {
    ABIERTA = "ABIERTA",
    CERRADA = "CERRADA",
    EN_PAUSA = "EN_PAUSA"
}
export declare enum CashRegisterMovementTypeDto {
    APERTURA = "APERTURA",
    INGRESO_VENTA = "INGRESO_VENTA",
    INGRESO_OTRO = "INGRESO_OTRO",
    SALIDA_GASTO = "SALIDA_GASTO",
    SALIDA_RETIRO = "SALIDA_RETIRO",
    CIERRE = "CIERRE",
    AJUSTE = "AJUSTE"
}
export declare enum PaymentMethodDto {
    EFECTIVO = "EFECTIVO",
    TARJETA_CREDITO = "TARJETA_CREDITO",
    TARJETA_DEBITO = "TARJETA_DEBITO",
    TRANSFERENCIA = "TRANSFERENCIA",
    YAPE_PLIN = "YAPE_PLIN",
    CHEQUE = "CHEQUE",
    CREDITO_TIENDA = "CREDITO_TIENDA"
}
export declare class CreateCashRegisterDto {
    name: string;
    description?: string;
    openingBalance?: number;
}
export declare class UpdateCashRegisterDto {
    name?: string;
    description?: string;
    status?: CashRegisterStatusDto;
}
export declare class OpenCashRegisterDto {
    openingBalance?: number;
}
export declare class CloseCashRegisterDto {
    actualClosingBalance: number;
    closingNotes?: string;
}
export declare class CreateCashRegisterMovementDto {
    type: CashRegisterMovementTypeDto;
    amount: number;
    isPositive: boolean;
    paymentMethod?: PaymentMethodDto;
    description: string;
    saleId?: string;
    notes?: string;
}
