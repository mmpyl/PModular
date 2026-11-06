import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ShrinkageReason } from '@prisma/client';

/**
 * FASE B2: Registro de mermas y pérdidas de productos perecibles.
 */
export class CreateShrinkageRecordDto {
  @IsString()
  productId!: string;

  /**
   * Lote afectado. Opcional: si no se indica, se descuenta del lote
   * activo más próximo a vencer (FEPS) del producto.
   */
  @IsOptional()
  @IsString()
  batchId?: string;

  @IsEnum(ShrinkageReason)
  reason!: ShrinkageReason;

  @IsNumber()
  @Min(0.0001)
  quantity!: number;

  /**
   * Costo unitario de la pérdida. Si se omite, se usa el costo del lote
   * (batch.unitCost) o el costo promedio del inventario.
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ShrinkageQueryDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  batchId?: string;

  @IsOptional()
  @IsEnum(ShrinkageReason)
  reason?: ShrinkageReason;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class ExpirationAlertsQueryDto {
  /** Días de anticipación para considerar "próximo a vencer" (default 7) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number;

  /** Incluir lotes ya vencidos con stock pendiente de dar de baja (default true) */
  @IsOptional()
  @IsBoolean()
  includeExpired?: boolean;
}
