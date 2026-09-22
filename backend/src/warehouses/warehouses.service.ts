import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StockMovementService } from '../stock-movements/stock-movements.service';
import { MovementReason } from '@prisma/client';
import { CreateWarehouseDto, UpdateWarehouseDto, CreateStockTransferDto, CompleteStockTransferDto } from './dto/create-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(
    private prisma: PrismaService,
    private stockMovementService: StockMovementService,
  ) {}

  async findAll(organizationId: string) {
    return this.prisma.warehouse.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id, organizationId },
      include: {
        inventory: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse ${id} not found`);
    }

    return warehouse;
  }

  async create(organizationId: string, dto: CreateWarehouseDto) {
    // Verify code uniqueness within organization
    const existing = await this.prisma.warehouse.findFirst({
      where: { organizationId, code: dto.code },
    });

    if (existing) {
      throw new BadRequestException(`Warehouse with code ${dto.code} already exists`);
    }

    return this.prisma.warehouse.create({
      data: {
        ...dto,
        organizationId,
      },
    });
  }

  async update(id: string, organizationId: string, dto: UpdateWarehouseDto) {
    // Verify code uniqueness if code is being updated
    if (dto.code) {
      const existing = await this.prisma.warehouse.findFirst({
        where: { 
          organizationId, 
          code: dto.code,
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException(`Warehouse with code ${dto.code} already exists`);
      }
    }

    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id, organizationId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse ${id} not found`);
    }

    return this.prisma.warehouse.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, organizationId: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id, organizationId },
      include: {
        inventory: true,
        transfersFrom: true,
        transfersTo: true,
      },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse ${id} not found`);
    }

    // Check if warehouse has inventory
    if (warehouse.inventory.some(i => i.quantity > 0)) {
      throw new BadRequestException('Cannot delete warehouse with existing inventory. Transfer or remove stock first.');
    }

    // Check if warehouse has pending transfers
    const hasPendingTransfers = 
      warehouse.transfersFrom.some(t => t.status !== 'COMPLETADA' && t.status !== 'CANCELADA') ||
      warehouse.transfersTo.some(t => t.status !== 'COMPLETADA' && t.status !== 'CANCELADA');

    if (hasPendingTransfers) {
      throw new BadRequestException('Cannot delete warehouse with pending transfers.');
    }

    return this.prisma.warehouse.delete({
      where: { id },
    });
  }

  async transferStock(
    fromWarehouseId: string,
    organizationId: string,
    dto: CreateStockTransferDto,
    performedBy: string,
  ) {
    // Verify source warehouse exists and belongs to organization
    const fromWarehouse = await this.prisma.warehouse.findUnique({
      where: { id: fromWarehouseId, organizationId },
    });

    if (!fromWarehouse) {
      throw new NotFoundException(`Source warehouse ${fromWarehouseId} not found`);
    }

    // Verify destination warehouse exists and belongs to organization
    const toWarehouse = await this.prisma.warehouse.findUnique({
      where: { id: dto.toWarehouseId, organizationId },
    });

    if (!toWarehouse) {
      throw new NotFoundException(`Destination warehouse ${dto.toWarehouseId} not found`);
    }

    if (fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException('Source and destination warehouses must be different');
    }

    // Generate transfer number
    const transferNumber = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create the transfer with items
    const transfer = await this.prisma.stockTransfer.create({
      data: {
        organizationId,
        transferNumber,
        fromWarehouseId,
        toWarehouseId: dto.toWarehouseId,
        status: 'PENDIENTE',
        notes: dto.notes,
        internalNotes: dto.internalNotes,
        items: {
          create: dto.items.map(item => ({
            productId: item.productId,
            quantityShipped: item.quantity,
            quantityReceived: 0,
            unitCost: 0, // Will be updated when receiving
            batchNumber: item.batchNumber,
            expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
            notes: item.notes,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        fromWarehouse: true,
        toWarehouse: true,
      },
    });

    // For each item, deduct stock from source warehouse using stock movement service
    for (const item of dto.items) {
      await this.stockMovementService.adjustStock(
        item.productId,
        organizationId,
        -item.quantity, // Negative for outgoing
        MovementReason.TRANSFERENCIA_SALIDA,
        performedBy,
        {
          referenceType: 'STOCK_TRANSFER',
          referenceId: transfer.id,
          notes: `Transfer to ${toWarehouse.name}: ${transfer.transferNumber}`,
        },
      );

      // Update warehouse inventory
      await this.prisma.warehouseInventory.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: fromWarehouseId,
            productId: item.productId,
          },
        },
        update: {
          quantity: { decrement: item.quantity },
        },
        create: {
          warehouseId: fromWarehouseId,
          productId: item.productId,
          organizationId,
          quantity: -item.quantity, // This will be negative, which indicates an issue
        },
      });
    }

    // Mark transfer as in transit
    return this.prisma.stockTransfer.update({
      where: { id: transfer.id },
      data: {
        status: 'EN_TRANSITO',
        shippedDate: new Date(),
        shippedBy: performedBy,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        fromWarehouse: true,
        toWarehouse: true,
      },
    });
  }

  async completeTransfer(
    transferId: string,
    organizationId: string,
    dto: CompleteStockTransferDto,
    performedBy: string,
  ) {
    const transfer = await this.prisma.stockTransfer.findUnique({
      where: { id: transferId, organizationId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        toWarehouse: true,
      },
    });

    if (!transfer) {
      throw new NotFoundException(`Transfer ${transferId} not found`);
    }

    if (transfer.status === 'COMPLETADA' || transfer.status === 'CANCELADA') {
      throw new BadRequestException(`Transfer cannot be completed. Current status: ${transfer.status}`);
    }

    // Process received items
    const receivedItems = dto.items || transfer.items.map(i => ({
      productId: i.productId,
      quantity: Number(i.quantityShipped),
      batchNumber: i.batchNumber,
      expirationDate: i.expirationDate,
    }));

    let allItemsReceived = true;

    for (const item of receivedItems) {
      const transferItem = transfer.items.find(i => i.productId === item.productId);
      
      if (!transferItem) {
        continue;
      }

      const quantityReceived = item.quantity || Number(transferItem.quantityShipped);
      
      if (quantityReceived < Number(transferItem.quantityShipped)) {
        allItemsReceived = false;
      }

      // Add stock to destination warehouse
      await this.stockMovementService.adjustStock(
        item.productId,
        organizationId,
        quantityReceived, // Positive for incoming
        MovementReason.TRANSFERENCIA_ENTRADA,
        performedBy,
        {
          referenceType: 'STOCK_TRANSFER',
          referenceId: transfer.id,
          notes: `Transfer from ${transfer.fromWarehouse.name}: ${transfer.transferNumber}`,
          batchNumber: item.batchNumber,
        },
      );

      // Update warehouse inventory at destination
      await this.prisma.warehouseInventory.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: transfer.toWarehouseId,
            productId: item.productId,
          },
        },
        update: {
          quantity: { increment: quantityReceived },
        },
        create: {
          warehouseId: transfer.toWarehouseId,
          productId: item.productId,
          organizationId,
          quantity: quantityReceived,
        },
      });

      // Update transfer item with received quantity
      await this.prisma.stockTransferItem.update({
        where: { id: transferItem.id },
        data: {
          quantityReceived,
        },
      });
    }

    // Update transfer status
    const finalStatus = allItemsReceived ? 'COMPLETADA' : 'RECIBIDA_PARCIALMENTE';

    return this.prisma.stockTransfer.update({
      where: { id: transferId },
      data: {
        status: finalStatus,
        receivedDate: new Date(),
        receivedBy: dto.receivedBy || performedBy,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        fromWarehouse: true,
        toWarehouse: true,
      },
    });
  }

  async getTransfers(
    organizationId: string,
    filters?: {
      status?: string;
      fromWarehouseId?: string;
      toWarehouseId?: string;
    },
  ) {
    const where: any = { organizationId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.fromWarehouseId) {
      where.fromWarehouseId = filters.fromWarehouseId;
    }
    if (filters?.toWarehouseId) {
      where.toWarehouseId = filters.toWarehouseId;
    }

    return this.prisma.stockTransfer.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        fromWarehouse: {
          select: { id: true, name: true, code: true },
        },
        toWarehouse: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: {
        transferDate: 'desc',
      },
    });
  }

  async getTransferById(transferId: string, organizationId: string) {
    const transfer = await this.prisma.stockTransfer.findUnique({
      where: { id: transferId, organizationId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
        fromWarehouse: {
          select: { id: true, name: true, code: true },
        },
        toWarehouse: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!transfer) {
      throw new NotFoundException(`Transfer ${transferId} not found`);
    }

    return transfer;
  }
}
