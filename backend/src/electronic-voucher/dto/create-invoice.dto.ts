import { IsString, IsOptional, IsNumber, IsEnum, IsObject, ValidateNested, IsArray, Min } from 'class-validator';
import { InvoiceType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateInvoiceDto {
  @IsEnum(InvoiceType)
  type: InvoiceType;

  @IsString()
  series: string;

  @IsString()
  correlation: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerTaxId?: string;

  @IsString()
  @IsOptional()
  customerAddress?: string;

  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsNumber()
  @Min(0)
  taxRate: number;

  @IsNumber()
  @Min(0)
  taxAmount: number;

  @IsNumber()
  @Min(0)
  discount: number;

  @IsNumber()
  @Min(0)
  total: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  internalNotes?: string;

  @IsString()
  @IsOptional()
  saleId?: string;
}

export class UpdateInvoiceStatusDto {
  @IsEnum(['PENDIENTE', 'ENVIADO', 'ACEPTADO', 'RECHAZADO', 'ANULADO'])
  status: string;

  @IsString()
  @IsOptional()
  sunatResponseCode?: string;

  @IsString()
  @IsOptional()
  sunatResponseMessage?: string;

  @IsString()
  @IsOptional()
  cdrHash?: string;

  @IsString()
  @IsOptional()
  cdrXml?: string;

  @IsString()
  @IsOptional()
  uuid?: string;
}

export class SendInvoiceToSunatDto {
  @IsString()
  organizationId: string;

  @IsString()
  invoiceId: string;
}

export class CancelInvoiceDto {
  @IsString()
  motivoAnulacion: string;

  @IsString()
  tipoDocumentoSustento: string;

  @IsString()
  numeroDocumentoSustento: string;
}
