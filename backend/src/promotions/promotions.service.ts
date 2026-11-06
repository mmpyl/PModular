import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { PromotionEngineService } from './promotion-engine.service';
import {
  CalculatePricingDto,
  CreatePromotionDto,
  UpdatePromotionDto,
} from './dto/promotion.dto';

/**
 * FASE B3: CRUD de promociones + endpoints de cálculo para el POS.
 */
@Injectable()
export class PromotionsService {
  constructor(
    private prisma: PrismaService,
    private engine: PromotionEngineService,
  ) {}

  private validateBusinessRules(dto: Partial<CreatePromotionDto>) {
    if (dto.type === 'COMBO' || dto.scope === 'COMBO') {
      if (!dto.items || dto.items.length < 2) {
        throw new BadRequestException(
          'Las promociones COMBO requieren al menos 2 productos en items',
        );
      }
    }
    if (dto.type === 'DOS_POR_UNO') {
      const block = dto.minQuantity ?? 2;
      const pay = dto.payQuantity ?? block - 1;
      if (block < 2 || pay < 1 || pay >= block) {
        throw new BadRequestException(
          '2x1/NxM inválidos: minQuantity es el tamaño del bloque (ej. 2) y payQuantity las unidades pagadas (ej. 1)',
        );
      }
    }
    if (
      dto.type === 'DESCUENTO_VOLUMEN' &&
      dto.discountPercent == null &&
      dto.discountAmount == null
    ) {
      throw new BadRequestException(
        'DESCUENTO_VOLUMEN requiere discountPercent o discountAmount',
      );
    }
    if (dto.type === 'PRECIO_POR_VOLUMEN' && dto.fixedPrice == null) {
      throw new BadRequestException(
        'PRECIO_POR_VOLUMEN requiere fixedPrice (precio unitario por volumen)',
      );
    }
    if (
      dto.startDate &&
      dto.endDate &&
      new Date(dto.startDate) > new Date(dto.endDate)
    ) {
      throw new BadRequestException('startDate no puede ser posterior a endDate');
    }
  }

  async create(organizationId: string, dto: CreatePromotionDto) {
    this.validateBusinessRules(dto);

    if (dto.type !== 'COMBO' && dto.scope !== 'CATEGORIA' && !dto.productId) {
      throw new BadRequestException(
        'La promoción debe apuntar a un producto (productId) o a una categoría (scope=CATEGORIA)',
      );
    }

    // Validar pertenencia tenant de referencias
    if (dto.productId) {
      await this.assertProductBelongsToOrg(organizationId, dto.productId);
    }
    if (dto.categoryId) {
      const cat = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, organizationId },
      });
      if (!cat) throw new NotFoundException(`Categoría ${dto.categoryId} no encontrada`);
    }
    for (const item of dto.items || []) {
      await this.assertProductBelongsToOrg(organizationId, item.productId);
    }

    try {
      return await this.prisma.promotion.create({
        data: {
          organizationId,
          code: dto.code,
          name: dto.name,
          type: dto.type,
          scope: dto.scope ?? (dto.type === 'COMBO' ? 'COMBO' : 'PRODUCTO'),
          productId: dto.productId ?? null,
          categoryId: dto.categoryId ?? null,
          minQuantity: dto.minQuantity ?? 1,
          payQuantity: dto.payQuantity ?? null,
          discountPercent:
            dto.discountPercent != null ? new Prisma.Decimal(dto.discountPercent) : null,
          discountAmount:
            dto.discountAmount != null ? new Prisma.Decimal(dto.discountAmount) : null,
          fixedPrice: dto.fixedPrice != null ? new Prisma.Decimal(dto.fixedPrice) : null,
          priority: dto.priority ?? 0,
          stackable: dto.stackable ?? false,
          startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          active: dto.active ?? true,
          maxUsesTotal: dto.maxUsesTotal ?? null,
          notes: dto.notes,
          items: dto.items?.length
            ? { create: dto.items.map((i) => ({ productId: i.productId, quantity: i.quantity })) }
            : undefined,
        },
        include: { items: { include: { product: { select: { id: true, name: true, sku: true } } } }, product: true },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new BadRequestException(`Ya existe una promoción con el código "${dto.code}"`);
      }
      throw e;
    }
  }

  async findAll(
    organizationId: string,
    filters: { active?: boolean; type?: string; productId?: string },
  ) {
    const where: any = { organizationId };
    if (filters.active !== undefined) where.active = filters.active;
    if (filters.type) where.type = filters.type;
    if (filters.productId) {
      where.OR = [
        { productId: filters.productId },
        { items: { some: { productId: filters.productId } } },
      ];
    }
    return this.prisma.promotion.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
      orderBy: [{ priority: 'desc' }, { startDate: 'desc' }],
    });
  }

  async findOne(organizationId: string, id: string) {
    const promo = await this.prisma.promotion.findFirst({
      where: { id, organizationId },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    });
    if (!promo) throw new NotFoundException(`Promoción ${id} no encontrada`);
    return promo;
  }

  async update(organizationId: string, id: string, dto: UpdatePromotionDto) {
    const existing = await this.findOne(organizationId, id);
    const merged: Partial<CreatePromotionDto> = {
      ...existing,
      ...dto,
      items: dto.items,
    } as any;
    this.validateBusinessRules(merged);

    const { items, ...rest } = dto;
    const data: any = { ...rest };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    if (dto.discountPercent !== undefined)
      data.discountPercent = dto.discountPercent == null ? null : new Prisma.Decimal(dto.discountPercent);
    if (dto.discountAmount !== undefined)
      data.discountAmount = dto.discountAmount == null ? null : new Prisma.Decimal(dto.discountAmount);
    if (dto.fixedPrice !== undefined)
      data.fixedPrice = dto.fixedPrice == null ? null : new Prisma.Decimal(dto.fixedPrice);
    delete data.createdAt;
    delete data.updatedAt;
    delete data.usedCount;

    if (items) {
      for (const item of items) {
        await this.assertProductBelongsToOrg(organizationId, item.productId);
      }
      data.items = {
        deleteMany: {},
        create: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      };
    }

    try {
      return await this.prisma.promotion.update({
        where: { id },
        data,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new BadRequestException(`Ya existe una promoción con el código "${dto.code}"`);
      }
      throw e;
    }
  }

  /** Desactivar (soft-delete): conserva historial de ventas ligadas. */
  async deactivate(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.promotion.update({
      where: { id },
      data: { active: false },
    });
  }

  /** Vista previa de pricing para el POS: aplica promociones vigentes al carrito. */
  async previewPricing(organizationId: string, dto: CalculatePricingDto) {
    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, organizationId },
      select: { id: true, price: true, categoryId: true },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException('Uno o más productos no existen en esta organización');
    }
    const catalogPrices = new Map(products.map((p) => [p.id, Number(p.price)]));
    const productCategory = new Map<string, string | null>(
      products.map((p) => [p.id, p.categoryId]),
    );

    const promotions = await this.engine.loadActivePromotions(organizationId);
    const result = this.engine.calculate(dto.items, promotions, catalogPrices, productCategory);

    return result;
  }

  private async assertProductBelongsToOrg(organizationId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, organizationId },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException(`Producto ${productId} no encontrado en la organización`);
    }
  }
}
