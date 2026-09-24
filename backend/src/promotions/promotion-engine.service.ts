import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PricingLineDto } from './dto/promotion.dto';

export interface EnginePromotion {
  id: string;
  code: string;
  name: string;
  type: 'DESCUENTO_VOLUMEN' | 'PRECIO_POR_VOLUMEN' | 'DOS_POR_UNO' | 'COMBO';
  scope: 'PRODUCTO' | 'CATEGORIA' | 'COMBO';
  productId: string | null;
  categoryId: string | null;
  minQuantity: number;
  payQuantity: number | null;
  discountPercent: number | null;
  discountAmount: number | null;
  fixedPrice: number | null;
  priority: number;
  stackable: boolean;
  maxUsesTotal: number | null;
  usedCount: number;
  items: { productId: string; quantity: number }[];
}

export interface EngineLine {
  productId: string;
  quantity: number;
  unitPrice: number; // precio base (catálogo o enviado por el carrito)
  grossSubtotal: number; // quantity * unitPrice antes de promos
  promoDiscount: number; // descuento acumulado por promociones del motor
  netSubtotal: number; // grossSubtotal - promoDiscount
}

export interface AppliedPromotion {
  promotionId: string;
  code: string;
  name: string;
  type: string;
  applications: number; // bloques/escalones aplicados
  discount: number; // descuento total aportado por esta promoción
  affectedProductIds: string[];
}

export interface PricingResult {
  lines: EngineLine[];
  promotionsApplied: AppliedPromotion[];
  subtotal: number; // suma de precios base
  promotionDiscount: number; // total descontado por el motor
  netSubtotal: number; // subtotal - promotionDiscount
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const r4 = (n: number) => Math.round(n * 10000) / 10000;

/**
 * Motor de promociones y precios por volumen (Fase B3).
 *
 * Reglas:
 *  - Solo entran promociones activas y dentro de su ventana de vigencia.
 *  - Se evalúan de mayor a menor `priority`; una línea solo recibe el
 *    beneficio de la primera promoción que le aplica (no se apila sobre la
 *    misma unidad), salvo promociones marcadas `stackable` sobre líneas
 *    distintas del mismo combo.
 *  - Nunca deja un neto negativo: el descuento por línea está topeado a su
 *    subtotal bruto.
 */
@Injectable()
export class PromotionEngineService {
  private readonly logger = new Logger(PromotionEngineService.name);

  constructor(private prisma: PrismaService) {}

  /** Carga las promociones vigentes de la organización ya "plain" para el motor. */
  async loadActivePromotions(
    organizationId: string,
    at: Date = new Date(),
  ): Promise<EnginePromotion[]> {
    const rows = await this.prisma.promotion.findMany({
      where: {
        organizationId,
        active: true,
        startDate: { lte: at },
        OR: [{ endDate: null }, { endDate: { gte: at } }],
      },
      include: { items: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    return rows.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      type: p.type as EnginePromotion['type'],
      scope: p.scope as EnginePromotion['scope'],
      productId: p.productId,
      categoryId: p.categoryId,
      minQuantity: p.minQuantity,
      payQuantity: p.payQuantity,
      discountPercent: p.discountPercent != null ? Number(p.discountPercent) : null,
      discountAmount: p.discountAmount != null ? Number(p.discountAmount) : null,
      fixedPrice: p.fixedPrice != null ? Number(p.fixedPrice) : null,
      priority: p.priority,
      stackable: p.stackable,
      maxUsesTotal: p.maxUsesTotal,
      usedCount: p.usedCount,
      items: p.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    }));
  }

  /**
   * Calcula el pricing de un carrito aplicando las promociones vigentes.
   * @param catalogPrices map productId -> price de catálogo
   * @param productCategory map productId -> categoryId | null
   */
  calculate(
    cart: PricingLineDto[],
    promotions: EnginePromotion[],
    catalogPrices: Map<string, number>,
    productCategory: Map<string, string | null>,
  ): PricingResult {
    // 1. Consolidar líneas por producto (un producto puede venir duplicado en el carrito)
    const consolidated = new Map<string, EngineLine>();
    for (const item of cart) {
      const qty = Number(item.quantity);
      if (!qty || qty <= 0) continue;
      const base =
        item.unitPrice != null ? Number(item.unitPrice) : catalogPrices.get(item.productId) ?? 0;
      const existing = consolidated.get(item.productId);
      if (existing) {
        existing.quantity = r4(existing.quantity + qty);
        existing.grossSubtotal = r2(existing.quantity * existing.unitPrice);
      } else {
        consolidated.set(item.productId, {
          productId: item.productId,
          quantity: qty,
          unitPrice: base,
          grossSubtotal: r2(qty * base),
          promoDiscount: 0,
          netSubtotal: r2(qty * base),
        });
      }
    }

    const lines = [...consolidated.values()];
    const applied: AppliedPromotion[] = [];
    // Unidades de cada producto ya consumidas por una promoción no apilable
    const consumedUnits = new Map<string, number>();

    const remainingUnits = (line: EngineLine) =>
      r4(line.quantity - (consumedUnits.get(line.productId) || 0));

    const addDiscount = (line: EngineLine, amount: number) => {
      const capped = Math.min(amount, line.netSubtotal);
      if (capped <= 0) return 0;
      line.promoDiscount = r2(line.promoDiscount + capped);
      line.netSubtotal = r2(line.netSubtotal - capped);
      return capped;
    };

    // 2. Evaluar promociones en orden de prioridad
    for (const promo of promotions) {
      // Tope de usos globales
      if (promo.maxUsesTotal != null && promo.usedCount >= promo.maxUsesTotal) continue;

      switch (promo.type) {
        case 'DOS_POR_UNO': {
          const target = this.resolveTargetLines(promo, lines, productCategory);
          for (const line of target) {
            const avail = remainingUnits(line);
            const blockSize = promo.minQuantity || 2; // ej. 2 en 2x1, 3 en 3x2
            const payPerBlock = Math.min(promo.payQuantity ?? blockSize - 1, blockSize - 1);
            if (blockSize < 2 || avail < blockSize) continue;
            const blocks = Math.floor(avail / blockSize);
            const freeUnits = blocks * (blockSize - payPerBlock);
            const discount = r2(freeUnits * line.unitPrice);
            const given = addDiscount(line, discount);
            if (given > 0) {
              this.consume(consumedUnits, line.productId, blocks * blockSize);
              this.record(applied, promo, blocks, given, [line.productId]);
            }
          }
          break;
        }

        case 'DESCUENTO_VOLUMEN': {
          const target = this.resolveTargetLines(promo, lines, productCategory);
          for (const line of target) {
            const avail = remainingUnits(line);
            if (avail < promo.minQuantity) continue;
            const escalones = promo.stackable ? 1 : 1; // descuento sobre toda la cantidad elegible
            void escalones;
            let discount = 0;
            if (promo.discountPercent != null) {
              discount = r2(avail * line.unitPrice * (promo.discountPercent / 100));
            } else if (promo.discountAmount != null) {
              discount = r2(promo.discountAmount);
            }
            const given = addDiscount(line, discount);
            if (given > 0) {
              this.consume(consumedUnits, line.productId, avail);
              this.record(applied, promo, 1, given, [line.productId]);
            }
          }
          break;
        }

        case 'PRECIO_POR_VOLUMEN': {
          if (!promo.productId && promo.scope !== 'CATEGORIA') continue;
          const target = this.resolveTargetLines(promo, lines, productCategory);
          for (const line of target) {
            const avail = remainingUnits(line);
            if (avail < promo.minQuantity || promo.fixedPrice == null) continue;
            if (promo.fixedPrice >= line.unitPrice) continue; // no es una mejora
            const discount = r2(avail * (line.unitPrice - promo.fixedPrice));
            const given = addDiscount(line, discount);
            if (given > 0) {
              this.consume(consumedUnits, line.productId, avail);
              this.record(applied, promo, 1, given, [line.productId]);
            }
          }
          break;
        }

        case 'COMBO': {
          if (!promo.items.length) continue;
          // ¿Cuántos combos completos se pueden armar con el carrito?
          let combos = Infinity;
          for (const ci of promo.items) {
            const line = lines.find((l) => l.productId === ci.productId);
            if (!line) {
              combos = 0;
              break;
            }
            combos = Math.min(combos, Math.floor(remainingUnits(line) / ci.quantity));
          }
          if (!isFinite(combos) || combos <= 0) break;

          // Precio normal de un bloque de combo
          let blockNormal = 0;
          const affected: string[] = [];
          for (const ci of promo.items) {
            const line = lines.find((l) => l.productId === ci.productId)!;
            blockNormal += ci.quantity * line.unitPrice;
            affected.push(ci.productId);
          }
          blockNormal = r2(blockNormal);

          let perBlockDiscount = 0;
          if (promo.fixedPrice != null) {
            perBlockDiscount = Math.max(0, r2(blockNormal - promo.fixedPrice));
          } else if (promo.discountPercent != null) {
            perBlockDiscount = r2(blockNormal * (promo.discountPercent / 100));
          } else if (promo.discountAmount != null) {
            perBlockDiscount = r2(promo.discountAmount);
          }
          if (perBlockDiscount <= 0) break;

          const totalDiscount = r2(perBlockDiscount * combos);
          // Repartir proporcionalmente entre las líneas del combo
          let distributed = 0;
          for (let i = 0; i < promo.items.length; i++) {
            const ci = promo.items[i];
            const line = lines.find((l) => l.productId === ci.productId)!;
            const share =
              i === promo.items.length - 1
                ? r2(totalDiscount - distributed)
                : r2(totalDiscount * ((ci.quantity * line.unitPrice) / blockNormal));
            distributed = r2(distributed + share);
            addDiscount(line, share);
            this.consume(consumedUnits, line.productId, combos * ci.quantity);
          }
          this.record(applied, promo, combos, totalDiscount, [...new Set(affected)]);
          break;
        }
      }
    }

    const subtotal = r2(lines.reduce((s, l) => s + l.grossSubtotal, 0));
    const promotionDiscount = r2(lines.reduce((s, l) => s + l.promoDiscount, 0));

    return {
      lines,
      promotionsApplied: applied,
      subtotal,
      promotionDiscount,
      netSubtotal: r2(subtotal - promotionDiscount),
    };
  }

  /** Productos objetivo de una promo de alcance PRODUCTO/CATEGORIA. */
  private resolveTargetLines(
    promo: EnginePromotion,
    lines: EngineLine[],
    productCategory: Map<string, string | null>,
  ): EngineLine[] {
    if (promo.scope === 'CATEGORIA' && promo.categoryId) {
      return lines.filter((l) => productCategory.get(l.productId) === promo.categoryId);
    }
    if (promo.productId) {
      return lines.filter((l) => l.productId === promo.productId);
    }
    return [];
  }

  private consume(map: Map<string, number>, productId: string, units: number) {
    map.set(productId, r4((map.get(productId) || 0) + units));
  }

  private record(
    applied: AppliedPromotion[],
    promo: EnginePromotion,
    applications: number,
    discount: number,
    affectedProductIds: string[],
  ) {
    const prev = applied.find((a) => a.promotionId === promo.id);
    if (prev) {
      prev.applications += applications;
      prev.discount = r2(prev.discount + discount);
      prev.affectedProductIds = [...new Set([...prev.affectedProductIds, ...affectedProductIds])];
    } else {
      applied.push({
        promotionId: promo.id,
        code: promo.code,
        name: promo.name,
        type: promo.type,
        applications,
        discount,
        affectedProductIds,
      });
    }
  }
}
