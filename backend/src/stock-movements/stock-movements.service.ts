import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Batch, StockMovement, BatchStatus, MovementType, MovementReason, InventoryItem } from '@prisma/client';

interface CreateStockMovementDto {
  productId: string;
  type: MovementType;
  reason: MovementReason;
  quantity: number;
  batchId?: string;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  organizationId: string;
  performedBy: string;
}

interface StockAdjustmentResult {
  movement: StockMovement;
  inventoryItem: InventoryItem;
  batch: Batch | null;
}

interface AdjustStockOptions {
  batchId?: string | null;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  unitCost?: number;
  batchNumber?: string;
  expirationDate?: Date;
}

@Injectable()
export class StockMovementService {
  constructor(private prisma: PrismaService) {}

  /**
   * Ajusta el stock de un producto creando un movimiento y actualizando
   * consistentemente el lote y el inventario general en una sola transacción.
   * Este es el ÚNICO método que debería usarse para modificar cantidades de inventario.
   */
  async adjustStock(
    productId: string,
    organizationId: string,
    quantityDelta: number,
    reason: MovementReason,
    performedBy: string,
    options?: AdjustStockOptions,
  ): Promise<StockAdjustmentResult> {
    return this.prisma.$transaction((tx) =>
      this.adjustStockInTransaction(
        tx,
        productId,
        organizationId,
        quantityDelta,
        reason,
        performedBy,
        options,
      ),
    );
  }

  /**
   * Versión interna de adjustStock que opera dentro de una transacción existente.
   * Permite que servicios externos (ventas, compras) incluyan operaciones de stock
   * en sus propias transacciones sin crear transacciones anidadas.
   */
  async adjustStockInTransaction(
    tx: any,
    productId: string,
    organizationId: string,
    quantityDelta: number,
    reason: MovementReason,
    performedBy: string,
    options?: AdjustStockOptions,
  ): Promise<StockAdjustmentResult> {
    const isPositive = quantityDelta > 0;
    const quantity = Math.abs(quantityDelta);
    const {
      batchId: providedBatchId,
      referenceType,
      referenceId,
      notes,
      unitCost,
      batchNumber,
      expirationDate,
    } = options || {};

    // Ejecutar la lógica dentro de la transacción proporcionada
    // Asegurar que existe el item de inventario
      let inventoryItem = await tx.inventoryItem.upsert({
        where: {
          productId_organizationId: {
            productId,
            organizationId,
          },
        },
        update: {},
        create: {
          productId,
          organizationId,
          quantity: 0,
          reserved: 0,
          averageCost: 0,
        },
      });

      let batch: Batch | null = null;
      let finalBatchId = providedBatchId;

      // Manejar lote
      if (isPositive && batchNumber) {
        // Para ingresos con número de lote, crear o actualizar lote
        const upsertedBatch = await tx.batch.upsert({
          where: {
            productId_batchNumber_organizationId: {
              productId,
              batchNumber,
              organizationId,
            },
          },
          update: {
            currentQuantity: { increment: quantity },
            initialQuantity: { increment: quantity },
            ...(unitCost ? { unitCost } : {}),
            ...(expirationDate ? { expirationDate } : {}),
          },
          create: {
            productId,
            organizationId,
            batchNumber,
            serialNumber: null,
            manufacturingDate: null,
            expirationDate: expirationDate || null,
            status: BatchStatus.ACTIVO,
            initialQuantity: quantity,
            currentQuantity: quantity,
            unitCost: unitCost || 0,
            location: null,
          },
        });
        batch = upsertedBatch;
        finalBatchId = batch.id;
      } else if (finalBatchId) {
        // Para egresos o ingresos con batchId existente
        const foundBatch = await tx.batch.findUnique({
          where: { id: finalBatchId },
        });

        if (!foundBatch) {
          throw new NotFoundException(`Batch ${finalBatchId} not found`);
        }

        batch = foundBatch;

        if (!isPositive && Number(batch.currentQuantity) < quantity) {
          throw new BadRequestException(
            `Insufficient stock in batch ${finalBatchId}. Available: ${batch.currentQuantity}, Required: ${quantity}`,
          );
        }

        const newQuantity = isPositive
          ? Number(batch.currentQuantity) + quantity
          : Number(batch.currentQuantity) - quantity;

        // Actualizar estado del lote si se agota
        let newStatus = batch.status;
        if (newQuantity <= 0) {
          newStatus = BatchStatus.AGOTADO;
        } else if (batch.expirationDate && batch.expirationDate < new Date()) {
          newStatus = BatchStatus.VENCIDO;
        }

        batch = await tx.batch.update({
          where: { id: finalBatchId },
          data: {
            currentQuantity: Math.max(0, newQuantity),
            status: newStatus,
            ...(unitCost && isPositive ? { unitCost } : {}),
          },
        });
      } else if (!isPositive) {
        // Para egresos sin batchId específico, usar FIFO
        const oldestBatch = await tx.batch.findFirst({
          where: {
            productId,
            organizationId,
            currentQuantity: { gte: quantity },
            status: 'ACTIVO',
          },
          orderBy: { expirationDate: 'asc' },
        });

        if (!oldestBatch) {
          throw new BadRequestException(
            `Insufficient stock for product ${productId}. Required: ${quantity}`,
          );
        }

        finalBatchId = oldestBatch.id;
        batch = oldestBatch;

        const newQuantity = Number(batch.currentQuantity) - quantity;
        let newStatus = batch.status;
        if (newQuantity <= 0) {
          newStatus = BatchStatus.AGOTADO;
        }

        batch = await tx.batch.update({
          where: { id: finalBatchId },
          data: {
            currentQuantity: newQuantity,
            status: newStatus,
          },
        });
      }

      // Crear el movimiento de stock
      const movement = await tx.stockMovement.create({
        data: {
          organizationId,
          productId,
          type: isPositive ? MovementType.INGRESO : MovementType.SALIDA,
          reason,
          quantity,
          isPositive,
          batchId: finalBatchId,
          referenceType,
          referenceId,
          notes,
          performedBy,
        },
      });

      // Recalcular inventario desde lotes activos (única fuente de verdad)
      inventoryItem = await this.recalculateInventoryInTransaction(tx, productId, organizationId);

      return {
        movement,
        inventoryItem,
        batch,
      };
  }

  async createStockMovement(dto: CreateStockMovementDto): Promise<StockMovement> {
    const result = await this.adjustStock(
      dto.productId,
      dto.organizationId,
      dto.type === 'INGRESO' ? dto.quantity : -dto.quantity,
      dto.reason,
      dto.performedBy,
      {
        batchId: dto.batchId,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        notes: dto.notes,
      },
    );
    return result.movement;
  }

  async getMovements(
    organizationId: string,
    filters?: {
      productId?: string;
      type?: string;
      reason?: string;
      referenceType?: string;
      referenceId?: string;
    },
  ): Promise<StockMovement[]> {
    const where: any = { organizationId };

    if (filters?.productId) {
      where.productId = filters.productId;
    }
    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.reason) {
      where.reason = filters.reason;
    }
    if (filters?.referenceType && filters?.referenceId) {
      where.referenceType = filters.referenceType;
      where.referenceId = filters.referenceId;
    }

    return this.prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
        batch: {
          select: {
            batchNumber: true,
            serialNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getMovementById(organizationId: string, id: string): Promise<StockMovement> {
    const movement = await this.prisma.stockMovement.findUnique({
      where: { id, organizationId },
      include: {
        product: true,
        batch: true,
      },
    });

    if (!movement) {
      throw new NotFoundException(`Stock movement ${id} not found`);
    }

    return movement;
  }

  /**
   * Versión del método recalculateInventory que funciona dentro de una transacción.
   * Calcula la cantidad total y el costo promedio desde los lotes activos (única fuente de verdad).
   */
  private async recalculateInventoryInTransaction(
    tx: any,
    productId: string,
    organizationId: string,
  ): Promise<InventoryItem> {
    // Obtener todos los lotes activos
    const batches = await tx.batch.findMany({
      where: {
        productId,
        organizationId,
        status: {
          in: ['ACTIVO', 'RETENIDO'],
        },
      },
    });

    const totalQuantity = batches.reduce((sum: number, batch: any) => sum + Number(batch.currentQuantity), 0);
    const totalValue = batches.reduce(
      (sum: number, batch: any) => sum + Number(batch.currentQuantity) * Number(batch.unitCost),
      0,
    );
    const averageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

    // Actualizar o crear item de inventario
    return tx.inventoryItem.upsert({
      where: {
        productId_organizationId: {
          productId,
          organizationId,
        },
      },
      update: {
        quantity: totalQuantity,
        averageCost,
      },
      create: {
        productId,
        organizationId,
        quantity: totalQuantity,
        reserved: 0,
        averageCost,
      },
    });
  }

  /**
   * Método público para recalcular inventario desde lotes activos.
   * Usado principalmente para operaciones fuera de transacción o para corregir inconsistencias.
   * @deprecated Use adjustStock() which automatically recalculates inventory after each movement.
   */
  async recalculateInventory(productId: string, organizationId: string): Promise<InventoryItem> {
    console.warn(
      `DEPRECATED: StockMovementService.recalculateInventory() called for product ${productId}. ` +
      'This should not be needed as adjustStock() already recalculates inventory automatically.',
    );
    
    // Obtener todos los lotes activos
    const batches = await this.prisma.batch.findMany({
      where: {
        productId,
        organizationId,
        status: {
          in: ['ACTIVO', 'RETENIDO'],
        },
      },
    });

    const totalQuantity = batches.reduce((sum: number, batch: any) => sum + Number(batch.currentQuantity), 0);
    const totalValue = batches.reduce(
      (sum: number, batch: any) => sum + Number(batch.currentQuantity) * Number(batch.unitCost),
      0,
    );
    const averageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

    // Actualizar o crear item de inventario
    return this.prisma.inventoryItem.upsert({
      where: {
        productId_organizationId: {
          productId,
          organizationId,
        },
      },
      update: {
        quantity: totalQuantity,
        averageCost,
      },
      create: {
        productId,
        organizationId,
        quantity: totalQuantity,
        reserved: 0,
        averageCost,
      },
    });
  }

  async registerInitialStock(
    productId: string,
    organizationId: string,
    quantity: number,
    unitCost: number,
    batchNumber?: string,
    expirationDate?: Date,
    performedBy?: string,
  ): Promise<{ movement: StockMovement; batch?: Batch }> {
    // Usar el nuevo método adjustStock que maneja todo consistentemente en transacción
    const result = await this.adjustStock(
      productId,
      organizationId,
      quantity, // Positivo para ingreso
      'ENTRADA_INICIAL',
      performedBy || 'system',
      {
        batchNumber,
        expirationDate,
        unitCost,
      },
    );

    return {
      movement: result.movement,
      batch: result.batch,
    };
  }
}
