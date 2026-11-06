import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsInt,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
  Max,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PromotionType {
  DESCUENTO_VOLUMEN = 'DESCUENTO_VOLUMEN',
  PRECIO_POR_VOLUMEN = 'PRECIO_POR_VOLUMEN',
  DOS_POR_UNO = 'DOS_POR_UNO',
  COMBO = 'COMBO',
}

export enum PromotionScope {
  PRODUCTO = 'PRODUCTO',
  CATEGORIA = 'CATEGORIA',
  COMBO = 'COMBO',
}

export class PromotionItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreatePromotionDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsEnum(PromotionType)
  type!: PromotionType;

  @IsEnum(PromotionScope)
  @IsOptional()
  scope?: PromotionScope;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  minQuantity?: number;

  // DOS_POR_UNO / NxM: unidades pagadas por bloque (ej. 2x1 -> 1, 3x2 -> 2)
  @IsInt()
  @Min(1)
  @IsOptional()
  payQuantity?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discountPercent?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fixedPrice?: number;

  @IsInt()
  @IsOptional()
  priority?: number;

  @IsBoolean()
  @IsOptional()
  stackable?: boolean;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxUsesTotal?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionItemDto)
  @ArrayMinSize(2, {
    message: 'COMBO requiere al menos 2 productos en promotionItems',
  })
  @IsOptional()
  items?: PromotionItemDto[];
}

export class UpdatePromotionDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(PromotionType)
  @IsOptional()
  type?: PromotionType;

  @IsEnum(PromotionScope)
  @IsOptional()
  scope?: PromotionScope;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  minQuantity?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  payQuantity?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discountPercent?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fixedPrice?: number;

  @IsInt()
  @IsOptional()
  priority?: number;

  @IsBoolean()
  @IsOptional()
  stackable?: boolean;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxUsesTotal?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionItemDto)
  @IsOptional()
  items?: PromotionItemDto[];
}

/**
 * Línea de carrito enviada por el POS/venta para calcular promociones
 * ANTES de crear la venta (vista previa de precios).
 */
export class PricingLineDto {
  @IsString()
  productId!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  // Precio unitario base del catálogo (si se omite, el motor usa product.price)
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;
}

export class CalculatePricingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingLineDto)
  @ArrayMinSize(1)
  items!: PricingLineDto[];
}
