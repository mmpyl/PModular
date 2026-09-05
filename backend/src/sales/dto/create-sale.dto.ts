import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SaleStatus as PrismaSaleStatus } from '@prisma/client';

export enum SaleStatus {
  BORRADOR = 'BORRADOR',
  CONFIRMADA = 'CONFIRMADA',
  EN_PROCESO = 'EN_PROCESO',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA',
  DEVUELTA_PARCIAL = 'DEVUELTA_PARCIAL',
  DEVUELTA_TOTAL = 'DEVUELTA_TOTAL',
}

export enum SaleType {
  VENTA_MOSTRADOR = 'VENTA_MOSTRADOR',
  PEDIDO = 'PEDIDO',
  RESERVA = 'RESERVA',
  ENTREGA_DOMICILIO = 'ENTREGA_DOMICILIO',
}

export enum PaymentTerm {
  CONTADO = 'CONTADO',
  CREDITO_7_DIAS = 'CREDITO_7_DIAS',
  CREDITO_15_DIAS = 'CREDITO_15_DIAS',
  CREDITO_30_DIAS = 'CREDITO_30_DIAS',
  CREDITO_60_DIAS = 'CREDITO_60_DIAS',
  CREDITO_90_DIAS = 'CREDITO_90_DIAS',
  PERSONALIZADO = 'PERSONALIZADO',
}

export class SaleItemDto {
  @IsString()
  productId!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  taxRate?: number;

  @IsString()
  @IsOptional()
  batchId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateSaleDto {
  @IsString()
  @IsOptional()
  customerId?: string;

  @IsEnum(SaleType)
  @IsOptional()
  type?: SaleType;

  @IsEnum(SaleStatus)
  @IsOptional()
  status?: SaleStatus;

  @IsDateString()
  @IsOptional()
  deliveryDate?: string;

  @IsEnum(PaymentTerm)
  @IsOptional()
  paymentTerm?: PaymentTerm;

  @IsDateString()
  @IsOptional()
  paymentDueDate?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  taxRate?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  internalNotes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items!: SaleItemDto[];
}

export class UpdateSaleDto {
  @IsEnum(SaleStatus)
  @IsOptional()
  status?: SaleStatus;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsEnum(SaleType)
  @IsOptional()
  type?: SaleType;

  @IsDateString()
  @IsOptional()
  deliveryDate?: string;

  @IsEnum(PaymentTerm)
  @IsOptional()
  paymentTerm?: PaymentTerm;

  @IsDateString()
  @IsOptional()
  paymentDueDate?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  taxRate?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  internalNotes?: string;
}

export class ProcessPaymentDto {
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  method!: string;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  cardLastFour?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
