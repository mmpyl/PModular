import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum CashRegisterStatusDto {
  ABIERTA = 'ABIERTA',
  CERRADA = 'CERRADA',
  EN_PAUSA = 'EN_PAUSA',
}

export enum CashRegisterMovementTypeDto {
  APERTURA = 'APERTURA',
  INGRESO_VENTA = 'INGRESO_VENTA',
  INGRESO_OTRO = 'INGRESO_OTRO',
  SALIDA_GASTO = 'SALIDA_GASTO',
  SALIDA_RETIRO = 'SALIDA_RETIRO',
  CIERRE = 'CIERRE',
  AJUSTE = 'AJUSTE',
}

export enum PaymentMethodDto {
  EFECTIVO = 'EFECTIVO',
  TARJETA_CREDITO = 'TARJETA_CREDITO',
  TARJETA_DEBITO = 'TARJETA_DEBITO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  YAPE_PLIN = 'YAPE_PLIN',
  CHEQUE = 'CHEQUE',
  CREDITO_TIENDA = 'CREDITO_TIENDA',
}

export class CreateCashRegisterDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  openingBalance?: number = 0;
}

export class UpdateCashRegisterDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CashRegisterStatusDto)
  @IsOptional()
  status?: CashRegisterStatusDto;
}

export class OpenCashRegisterDto {
  @IsNumber()
  @IsOptional()
  openingBalance?: number = 0;
}

export class CloseCashRegisterDto {
  @IsNumber()
  actualClosingBalance!: number;

  @IsString()
  @IsOptional()
  closingNotes?: string;
}

export class CreateCashRegisterMovementDto {
  @IsEnum(CashRegisterMovementTypeDto)
  type!: CashRegisterMovementTypeDto;

  @IsNumber()
  amount!: number;

  @IsBoolean()
  isPositive!: boolean;

  @IsEnum(PaymentMethodDto)
  @IsOptional()
  paymentMethod?: PaymentMethodDto;

  @IsString()
  description!: string;

  @IsString()
  @IsOptional()
  saleId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
