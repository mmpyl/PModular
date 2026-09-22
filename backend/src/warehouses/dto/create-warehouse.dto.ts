import { IsString, IsOptional, IsBoolean, IsObject, IsEnum, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWarehouseDto {
  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}

export class UpdateWarehouseDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}

export enum StockTransferStatusDto {
  PENDIENTE = 'PENDIENTE',
  EN_TRANSITO = 'EN_TRANSITO',
  RECIBIDA_PARCIALMENTE = 'RECIBIDA_PARCIALMENTE',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA',
}

export class StockTransferItemDto {
  @IsString()
  productId!: string;

  @IsNumber()
  quantity!: number;

  @IsString()
  @IsOptional()
  batchNumber?: string;

  @IsString()
  @IsOptional()
  expirationDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateStockTransferDto {
  @IsString()
  toWarehouseId!: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  internalNotes?: string;

  @ValidateNested({ each: true })
  @Type(() => StockTransferItemDto)
  items!: StockTransferItemDto[];
}

export class CompleteStockTransferDto {
  @IsString()
  @IsOptional()
  receivedBy?: string;

  @ValidateNested({ each: true })
  @Type(() => StockTransferItemDto)
  @IsOptional()
  items?: StockTransferItemDto[];
}
