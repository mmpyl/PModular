import { IsString, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum SaleStatusDto {
  PENDIENTE = 'PENDIENTE',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA',
  DEVOLUCION = 'DEVOLUCION',
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

export class CreateSaleItemDto {
  @IsString()
  productId!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  unitPrice!: number;

  @IsNumber()
  @IsOptional()
  discount?: number = 0;

  @IsNumber()
  @IsOptional()
  taxRate?: number = 0;

  @IsString()
  @IsOptional()
  batchId?: string;
}

export class CreatePaymentDto {
  @IsEnum(PaymentMethodDto)
  method!: PaymentMethodDto;

  @IsNumber()
  amount!: number;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateSaleDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerDocument?: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  documentSeries?: string;

  @IsOptional()
  @IsString()
  documentNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  cashRegisterId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items!: CreateSaleItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentDto)
  @IsOptional()
  payments?: CreatePaymentDto[];
}

export class UpdateSaleDto {
  @IsOptional()
  @IsEnum(SaleStatusDto)
  status?: SaleStatusDto;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerDocument?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteSaleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentDto)
  payments!: CreatePaymentDto[];
}
