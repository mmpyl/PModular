import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InventoryItem, Batch, StockMovement, MovementType, MovementReason } from '@prisma/client';

interface CreateInventoryItemDto {
  productId: string;
  organizationId: string;
}

interface UpdateInventoryDto {
  quantity?: number;
  reserved?: number;
  averageCost?: number;
  lastCountedAt?: Date;
}

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getInventory(organizationId: string, productId?: string): Promise<InventoryItem[]> {
    const where: any = { organizationId };
    if (productId) {
      where.productId = productId;
    }

    return this.prisma.inventoryItem.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: { select: { name: true } },
            unit: { select: { name: true, symbol: true } },
          },
        },
        batches: {
          where: { status: 'ACTIVO' },
          orderBy: { expirationDate: 'asc' },
        },
      },
    });
  }

  async getInventoryById(organizationId: string, id: string): Promise<InventoryItem> {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id, organizationId },
      include: {
        product: true,
        batches: {
          orderBy: { expirationDate: 'asc' },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Inventory item ${id} not found`);
    }

    return item;
  }

  async ensureInventoryItem(productId: string, organizationId: string): Promise<InventoryItem> {
    // Verifica si ya existe
    const existing = await this.prisma.inventoryItem.findUnique({
      where: {
        productId_organizationId: {
          productId,
          organizationId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Crea el registro de inventario si no existe
    return this.prisma.inventoryItem.create({
      data: {
        productId,
        organizationId,
        quantity: 0,
        reserved: 0,
        averageCost: 0,
      },
    });
  }

  async updateInventory(
    organizationId: string,
    id: string,
    dto: UpdateInventoryDto,
  ): Promise<InventoryItem> {
    const existing = await this.prisma.inventoryItem.findUnique({
      where: { id_organizationId: { id, organizationId } },
    });

    if (!existing) {
      throw new NotFoundException(`Inventory item ${id} not found`);
    }

    return this.prisma.inventoryItem.update({
      where: { id_organizationId: { id, organizationId } },
      data: dto,
    });
  }

  async recalculateInventory(productId: string, organizationId: string): Promise<InventoryItem> {
    // Recalcula cantidad total y costo promedio basado en lotes activos
    const batches = await this.prisma.batch.findMany({
      where: {
        productId,
        organizationId,
        status: 'ACTIVO',
      },
    });

    const totalQuantity = batches.reduce((sum, batch) => sum + Number(batch.currentQuantity), 0);
    const totalValue = batches.reduce(
      (sum, batch) => sum + Number(batch.currentQuantity) * Number(batch.unitCost),
      0,
    );
    const averageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

    return this.prisma.inventoryItem.update({
      where: {
        productId_organizationId: {
          productId,
          organizationId,
        },
      },
      data: {
        quantity: totalQuantity,
        averageCost,
      },
    });
  }

  async getLowStockItems(
    organizationId: string,
    threshold: number = 10,
  ): Promise<InventoryItem[]> {
    return this.prisma.inventoryItem.findMany({
      where: {
        organizationId,
        quantity: {
          lte: threshold,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
    });
  }

  async getExpiringBatches(
    organizationId: string,
    daysThreshold: number = 30,
  ): Promise<Batch[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysThreshold);

    return this.prisma.batch.findMany({
      where: {
        organizationId,
        status: 'ACTIVO',
        expirationDate: {
          lte: futureDate,
        },
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
      },
      orderBy: {
        expirationDate: 'asc',
      },
    });
  }
}
