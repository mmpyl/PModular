import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Batch, StockMovement, BatchStatus, MovementType, MovementReason } from '@prisma/client';

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

@Injectable()
export class StockMovementService {
  constructor(private prisma: PrismaService) {}

  async createStockMovement(dto: CreateStockMovementDto): Promise<StockMovement> {
    const {
      productId,
      type,
      reason,
      quantity,
      batchId,
      referenceType,
      referenceId,
      notes,
      organizationId,
      performedBy,
    } = dto;

    // Validar que el producto exista
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    // Determinar si es positivo o negativo
    const isPositive = type === 'INGRESO';

    // Crear el movimiento
    const movement = await this.prisma.stockMovement.create({
      data: {
        organizationId,
        productId,
        type: type as any,
        reason: reason as any,
        quantity,
        isPositive,
        batchId,
        referenceType,
        referenceId,
        notes,
        performedBy,
      },
    });

    // Actualizar el lote si se proporcionó
    if (batchId) {
      const batch = await this.prisma.batch.findUnique({
        where: { id: batchId },
      });

      if (!batch) {
        throw new NotFoundException(`Batch ${batchId} not found`);
      }

      const newQuantity = isPositive
        ? Number(batch.currentQuantity) + Number(quantity)
        : Number(batch.currentQuantity) - Number(quantity);

      // Actualizar estado del lote si se agota
      let newStatus = batch.status;
      if (newQuantity <= 0) {
        newStatus = BatchStatus.AGOTADO;
      } else if (batch.expirationDate && batch.expirationDate < new Date()) {
        newStatus = BatchStatus.VENCIDO;
      }

      await this.prisma.batch.update({
        where: { id: batchId },
        data: {
          currentQuantity: Math.max(0, newQuantity),
          status: newStatus,
        },
      });
    }

    // Recalcular inventario
    await this.recalculateInventory(productId, organizationId);

    return movement;
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

  private async recalculateInventory(productId: string, organizationId: string): Promise<void> {
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

    const totalQuantity = batches.reduce((sum, batch) => sum + Number(batch.currentQuantity), 0);
    const totalValue = batches.reduce(
      (sum, batch) => sum + Number(batch.currentQuantity) * Number(batch.unitCost),
      0,
    );
    const averageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

    // Actualizar o crear item de inventario
    await this.prisma.inventoryItem.upsert({
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
    // Asegurar que existe el item de inventario
    await this.prisma.inventoryItem.upsert({
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

    // Crear lote si se proporciona número de lote
    let batch: Batch | undefined;
    if (batchNumber) {
      batch = await this.prisma.batch.create({
        data: {
          productId,
          organizationId,
          batchNumber,
          expirationDate,
          initialQuantity: quantity,
          currentQuantity: quantity,
          unitCost,
          status: BatchStatus.ACTIVO,
        },
      });
    }

    // Registrar movimiento
    const movement = await this.prisma.stockMovement.create({
      data: {
        organizationId,
        productId,
        type: 'INGRESO',
        reason: 'ENTRADA_INICIAL',
        quantity,
        isPositive: true,
        batchId: batch?.id,
        performedBy: performedBy || 'system',
      },
    });

    // Actualizar inventario
    await this.recalculateInventory(productId, organizationId);

    return { movement, batch };
  }
}
