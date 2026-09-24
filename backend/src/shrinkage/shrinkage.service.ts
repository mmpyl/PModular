import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Batch,
  BatchStatus,
  MovementReason,
  Prisma,
  ShrinkageReason,
} from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { StockMovementService } from '../stock-movements/stock-movements.service';
import { CreateShrinkageRecordDto, ShrinkageQueryDto } from './dto/shrinkage.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Umbral por defecto (días) para alertar vencimientos próximos en perecibles */
const DEFAULT_EXPIRATION_ALERT_DAYS = 7;

export interface ExpirationAlertItem {
  batchId: string;
  productId: string;
  productName: string;
  sku: string | null;
  batchNumber: string;
  expirationDate: Date;
  daysUntilExpiration: number;
  currentQuantity: number;
  unitCost: number;
  valueAtRisk: number;
  state: 'VENCIDO' | 'PROXIMO_A_VENCER';
}

export interface ShrinkageSummary {
  period: { startDate: Date; endDate: Date };
  totalRecords: number;
  totalQuantity: number;
  totalLossValue: number;
  byReason: Array<{
    reason: ShrinkageReason;
    records: number;
    quantity: number;
    lossValue: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    sku: string | null;
    records: number;
    quantity: number;
    lossValue: number;
  }>;
  /** % de unidades perdidas vs unidades vendidas en el período */
  shrinkageRatePercent: number | null;
}

@Injectable()
export class ShrinkageService {
  private readonly logger = new Logger(ShrinkageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stockMovements: StockMovementService,
  ) {}

  // ============================================================
  // Registro de mermas / pérdidas
  // ============================================================

  /**
   * Registra una pérdida de inventario (merma) y genera automáticamente
   * el movimiento de stock SALIDA correspondiente, manteniendo la
   * trazabilidad por lote. Al ser un producto vencido, el lote queda
   * marcado como VENCIDO cuando se da de baja todo su remanente.
   */
  async createShrinkageRecord(
    organizationId: string,
    dto: CreateShrinkageRecordDto,
    performedBy: string,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, organizationId },
    });
    if (!product) {
      throw new NotFoundException(`Product ${dto.productId} not found`);
    }

    // Resolver el lote afectado (FEPS: el más próximo a vencer si no se indica)
    const batch = await this.resolveBatch(organizationId, dto);

    // Costo unitario: explícito > lote > promedio de inventario
    let unitCost = dto.unitCost;
    if (unitCost === undefined) {
      if (batch) {
        unitCost = Number(batch.unitCost);
      } else {
        const inventory = await this.prisma.inventoryItem.findUnique({
          where: {
            productId_organizationId: { productId: dto.productId, organizationId },
          },
        });
        unitCost = Number(inventory?.averageCost ?? product.cost ?? 0);
      }
    }

    const quantity = Math.abs(dto.quantity);
    const totalLoss = Number((quantity * unitCost).toFixed(2));
    const lossPercent =
      batch && Number(batch.initialQuantity) > 0
        ? Number(((quantity / Number(batch.initialQuantity)) * 100).toFixed(2))
        : null;

    // Mapear motivo de merma al motivo de movimiento de stock
    const movementReason = this.toMovementReason(dto.reason);

    // Movimiento de salida (descuenta lote + inventario en una transacción)
    const result = await this.stockMovements.adjustStock(
      dto.productId,
      organizationId,
      -quantity,
      movementReason,
      performedBy,
      {
        batchId: batch?.id,
        referenceType: 'SHRINKAGE',
        notes: dto.notes,
      },
    );

    // Si el lote venció (merma por vencimiento o fecha ya superada), marcarlo VENCIDO
    if (batch) {
      const isExpired =
        dto.reason === ShrinkageReason.VENCIMIENTO ||
        (batch.expirationDate !== null && batch.expirationDate < new Date());
      if (isExpired && result.batch && Number(result.batch.currentQuantity) > 0) {
        await this.prisma.batch.update({
          where: { id: batch.id },
          data: { status: BatchStatus.VENCIDO },
        });
      }
    }

    const recordNumber = await this.generateRecordNumber(organizationId);

    const record = await this.prisma.shrinkageRecord.create({
      data: {
        organizationId,
        recordNumber,
        productId: dto.productId,
        batchId: result.movement.batchId ?? batch?.id ?? null,
        reason: dto.reason,
        quantity,
        unitCost,
        totalLoss,
        lossPercent,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
        notes: dto.notes,
        stockMovementId: result.movement.id,
        recordedBy: performedBy,
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        batch: {
          select: {
            id: true,
            batchNumber: true,
            expirationDate: true,
            initialQuantity: true,
          },
        },
      },
    });

    this.logger.log(
      `Merma registrada ${recordNumber}: ${quantity} u. de ${product.name} (${dto.reason}), pérdida S/ ${totalLoss}`,
    );

    return record;
  }

  async listShrinkageRecords(
    organizationId: string,
    query: ShrinkageQueryDto = {},
  ) {
    const where: Prisma.ShrinkageRecordWhereInput = { organizationId };

    if (query.productId) where.productId = query.productId;
    if (query.batchId) where.batchId = query.batchId;
    if (query.reason) where.reason = query.reason;

    if (query.startDate || query.endDate) {
      where.occurredAt = {
        ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
        ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
      };
    }

    return this.prisma.shrinkageRecord.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        batch: {
          select: {
            id: true,
            batchNumber: true,
            expirationDate: true,
            status: true,
          },
        },
      },
      orderBy: { occurredAt: 'desc' },
      take: query.limit ?? 200,
    });
  }

  async getShrinkageRecordById(organizationId: string, id: string) {
    const record = await this.prisma.shrinkageRecord.findFirst({
      where: { id, organizationId },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        batch: true,
        stockMovement: true,
      },
    });
    if (!record) {
      throw new NotFoundException(`Shrinkage record ${id} not found`);
    }
    return record;
  }

  /**
   * Resumen de pérdidas para reportes (por defecto: últimos 30 días).
   */
  async getShrinkageSummary(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ShrinkageSummary> {
    const end = endDate ?? new Date();
    const start = startDate ?? new Date(end.getTime() - 30 * DAY_MS);

    const records = await this.prisma.shrinkageRecord.findMany({
      where: { organizationId, occurredAt: { gte: start, lte: end } },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
    });

    const byReasonMap = new Map<
      ShrinkageReason,
      { records: number; quantity: number; lossValue: number }
    >();
    const byProductMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        sku: string | null;
        records: number;
        quantity: number;
        lossValue: number;
      }
    >();

    let totalQuantity = 0;
    let totalLossValue = 0;

    for (const rec of records) {
      const qty = Number(rec.quantity);
      const loss = Number(rec.totalLoss);
      totalQuantity += qty;
      totalLossValue += loss;

      const reasonAgg = byReasonMap.get(rec.reason) ?? {
        records: 0,
        quantity: 0,
        lossValue: 0,
      };
      reasonAgg.records += 1;
      reasonAgg.quantity += qty;
      reasonAgg.lossValue += loss;
      byReasonMap.set(rec.reason, reasonAgg);

      const prodAgg = byProductMap.get(rec.productId) ?? {
        productId: rec.productId,
        productName: rec.product?.name ?? 'Desconocido',
        sku: rec.product?.sku ?? null,
        records: 0,
        quantity: 0,
        lossValue: 0,
      };
      prodAgg.records += 1;
      prodAgg.quantity += qty;
      prodAgg.lossValue += loss;
      byProductMap.set(rec.productId, prodAgg);
    }

    // Tasa de merma: unidades perdidas vs unidades vendidas en el período
    const soldAgg = await this.prisma.saleItem.aggregate({
      _sum: { quantity: true },
      where: {
        sale: {
          organizationId,
          status: 'COMPLETADA',
          saleDate: { gte: start, lte: end },
        },
      },
    });
    const soldQuantity = Number(soldAgg._sum.quantity ?? 0);
    const shrinkageRatePercent =
      soldQuantity > 0
        ? Number(((totalQuantity / soldQuantity) * 100).toFixed(2))
        : null;

    const topProducts = [...byProductMap.values()]
      .sort((a, b) => b.lossValue - a.lossValue)
      .slice(0, 10);

    return {
      period: { startDate: start, endDate: end },
      totalRecords: records.length,
      totalQuantity: Number(totalQuantity.toFixed(4)),
      totalLossValue: Number(totalLossValue.toFixed(2)),
      byReason: [...byReasonMap.entries()].map(([reason, agg]) => ({
        reason,
        records: agg.records,
        quantity: Number(agg.quantity.toFixed(4)),
        lossValue: Number(agg.lossValue.toFixed(2)),
      })),
      topProducts: topProducts.map((p) => ({
        ...p,
        quantity: Number(p.quantity.toFixed(4)),
        lossValue: Number(p.lossValue.toFixed(2)),
      })),
      shrinkageRatePercent,
    };
  }

  // ============================================================
  // Alertas de vencimiento (trazabilidad de perecibles)
  // ============================================================

  /**
   * Lista lotes con vencimiento: ya vencidos (con remanente por dar de baja)
   * y próximos a vencer dentro del umbral de días indicado.
   */
  async getExpirationAlerts(
    organizationId: string,
    days: number = DEFAULT_EXPIRATION_ALERT_DAYS,
    includeExpired: boolean = true,
  ): Promise<ExpirationAlertItem[]> {
    const now = new Date();
    const horizon = new Date(now.getTime() + days * DAY_MS);

    const batches = await this.prisma.batch.findMany({
      where: {
        organizationId,
        currentQuantity: { gt: 0 },
        expirationDate: includeExpired ? { lte: horizon } : { gt: now, lte: horizon },
        status: { in: [BatchStatus.ACTIVO, BatchStatus.RETENIDO, BatchStatus.VENCIDO] },
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
      orderBy: { expirationDate: 'asc' },
    });

    return batches
      .filter((b) => b.expirationDate !== null)
      .map((b) => {
        const exp = b.expirationDate as Date;
        const daysUntil = Math.ceil((exp.getTime() - now.getTime()) / DAY_MS);
        return {
          batchId: b.id,
          productId: b.productId,
          productName: b.product.name,
          sku: b.product.sku ?? null,
          batchNumber: b.batchNumber,
          expirationDate: exp,
          daysUntilExpiration: daysUntil,
          currentQuantity: Number(b.currentQuantity),
          unitCost: Number(b.unitCost),
          valueAtRisk: Number(
            (Number(b.currentQuantity) * Number(b.unitCost)).toFixed(2),
          ),
          state: exp < now ? ('VENCIDO' as const) : ('PROXIMO_A_VENCER' as const),
        };
      });
  }

  /**
   * Marca automáticamente como VENCIDO todos los lotes activos cuya fecha
   * de vencimiento ya pasó (job diario de control de perecibles).
   */
  async autoExpireBatches(organizationId?: string): Promise<number> {
    const now = new Date();
    const result = await this.prisma.batch.updateMany({
      where: {
        ...(organizationId ? { organizationId } : {}),
        status: { in: [BatchStatus.ACTIVO, BatchStatus.RETENIDO] },
        expirationDate: { lt: now },
        currentQuantity: { gt: 0 },
      },
      data: { status: BatchStatus.VENCIDO },
    });

    if (result.count > 0) {
      this.logger.log(
        `Control de vencimientos: ${result.count} lote(s) marcados como VENCIDO`,
      );
    }
    return result.count;
  }

  // ============================================================
  // Helpers
  // ============================================================

  private async resolveBatch(
    organizationId: string,
    dto: CreateShrinkageRecordDto,
  ): Promise<Batch | null> {
    if (dto.batchId) {
      const batch = await this.prisma.batch.findFirst({
        where: { id: dto.batchId, organizationId, productId: dto.productId },
      });
      if (!batch) {
        throw new NotFoundException(
          `Batch ${dto.batchId} not found for product ${dto.productId}`,
        );
      }
      if (Number(batch.currentQuantity) < dto.quantity) {
        throw new BadRequestException(
          `Cantidad insuficiente en lote ${batch.batchNumber}. Disponible: ${batch.currentQuantity}`,
        );
      }
      return batch;
    }

    // FEPS: lote activo con stock suficiente más próximo a vencer
    const candidates = await this.prisma.batch.findMany({
      where: {
        organizationId,
        productId: dto.productId,
        status: { in: [BatchStatus.ACTIVO, BatchStatus.VENCIDO] },
        currentQuantity: { gte: dto.quantity },
      },
      orderBy: { expirationDate: 'asc' },
      take: 5,
    });

    return candidates[0] ?? null;
  }

  private toMovementReason(reason: ShrinkageReason): MovementReason {
    switch (reason) {
      case ShrinkageReason.VENCIMIENTO:
        return MovementReason.OBSOLETO;
      case ShrinkageReason.ROBO:
        return MovementReason.ROBO;
      case ShrinkageReason.DANIO:
      case ShrinkageReason.DESCOMPOSICION:
      case ShrinkageReason.OTROS:
      default:
        return MovementReason.MERMA;
    }
  }

  private async generateRecordNumber(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `MER-${year}-`;
    const count = await this.prisma.shrinkageRecord.count({
      where: { organizationId, recordNumber: { startsWith: prefix } },
    });
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }
}
