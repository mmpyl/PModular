import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  CreateMovementDto,
  CreateAdjustmentDto,
  StockAdjustmentItemDto,
} from '../dto/inventory.dto';
import { MovementType, AdjustmentStatus, Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // Warehouse Methods
  // ==========================================

  async createWarehouse(organizationId: string, dto: CreateWarehouseDto) {
    // Si es default, desmarcar otras bodegas como default
    if (dto.isDefault) {
      await this.prisma.warehouse.updateMany({
        where: { organizationId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.warehouse.create({
      data: {
        ...dto,
        organizationId,
      },
    });
  }

  async findAllWarehouses(organizationId: string) {
    return this.prisma.warehouse.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async findWarehouseById(organizationId: string, id: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, organizationId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Bodega con ID ${id} no encontrada`);
    }

    return warehouse;
  }

  async updateWarehouse(organizationId: string, id: string, dto: UpdateWarehouseDto) {
    // Verificar que existe
    await this.findWarehouseById(organizationId, id);

    // Si se marca como default, desmarcar otras
    if (dto.isDefault) {
      await this.prisma.warehouse.updateMany({
        where: { organizationId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.warehouse.update({
      where: { id },
      data: dto,
    });
  }

  async deleteWarehouse(organizationId: string, id: string) {
    const warehouse = await this.findWarehouseById(organizationId, id);

    // Verificar si tiene stock
    const stockCount = await this.prisma.stockItem.count({
      where: { warehouseId: id },
    });

    if (stockCount > 0) {
      throw new ConflictException('No se puede eliminar una bodega con stock registrado');
    }

    return this.prisma.warehouse.delete({
      where: { id },
    });
  }

  // ==========================================
  // Stock Item Methods
  // ==========================================

  async getStockByProduct(organizationId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, organizationId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    const stockItems = await this.prisma.stockItem.findMany({
      where: { organizationId, productId },
      include: {
        warehouse: true,
      },
    });

    const totalQuantity = stockItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const totalReserved = stockItems.reduce((sum: number, item: any) => sum + item.reserved, 0);

    return {
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      totalQuantity,
      totalReserved,
      stockByWarehouse: stockItems.map((item: any) => ({
        warehouseId: item.warehouseId,
        warehouseName: item.warehouse.name,
        quantity: item.quantity,
        reserved: item.reserved,
      })),
    };
  }

  async getInventorySummary(organizationId: string) {
    const stockItems = await this.prisma.stockItem.findMany({
      where: { organizationId },
      include: {
        product: true,
        warehouse: true,
      },
    });

    // Agrupar por producto
    const productMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        sku: string | null;
        cost: number | null;
        totalQuantity: number;
        warehouses: { warehouseId: string; warehouseName: string; quantity: number }[];
      }
    >();

    for (const item of stockItems) {
      if (!productMap.has(item.productId)) {
        productMap.set(item.productId, {
          productId: item.productId,
          productName: item.product.name,
          sku: item.product.sku,
          cost: item.product.cost ? parseFloat(item.product.cost.toString()) : null,
          totalQuantity: 0,
          warehouses: [],
        });
      }

      const product = productMap.get(item.productId)!;
      product.totalQuantity += item.quantity;
      product.warehouses.push({
        warehouseId: item.warehouseId,
        warehouseName: item.warehouse.name,
        quantity: item.quantity,
      });
    }

    const items = Array.from(productMap.values()).map((p) => ({
      productId: p.productId,
      productName: p.productName,
      sku: p.sku,
      totalQuantity: p.totalQuantity,
      cost: p.cost,
      totalValue: p.cost ? p.cost * p.totalQuantity : 0,
    }));

    const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);
    const lowStockCount = items.filter((item) => item.totalQuantity === 0).length;

    return {
      totalProducts: items.length,
      totalValue,
      lowStockCount,
      items,
    };
  }

  async initializeStockForProduct(
    organizationId: string,
    productId: string,
    warehouseId: string,
    initialQuantity: number,
    createdBy: string,
  ) {
    // Verificar que el producto existe
    const product = await this.prisma.product.findFirst({
      where: { id: productId, organizationId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    // Verificar que la bodega existe
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, organizationId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Bodega con ID ${warehouseId} no encontrada`);
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Crear o actualizar stock item
      const stockItem = await tx.stockItem.upsert({
        where: {
          organizationId_productId_warehouseId: {
            organizationId,
            productId,
            warehouseId,
          },
        },
        update: {
          quantity: { increment: initialQuantity },
        },
        create: {
          organizationId,
          productId,
          warehouseId,
          quantity: initialQuantity,
          reserved: 0,
        },
      });

      // Registrar movimiento
      await tx.stockMovement.create({
        data: {
          organizationId,
          productId,
          warehouseId,
          movementType: MovementType.IN_ADJUSTMENT,
          quantity: initialQuantity,
          balanceAfter: stockItem.quantity,
          notes: 'Inicialización de stock',
          createdBy,
        },
      });

      return stockItem;
    });
  }

  // ==========================================
  // Stock Movement Methods
  // ==========================================

  async registerMovement(
    organizationId: string,
    dto: CreateMovementDto,
    createdBy: string,
  ) {
    const { productId, warehouseId, movementType, quantity, referenceId, referenceType, notes } = dto;

    // Verificar que el producto existe
    const product = await this.prisma.product.findFirst({
      where: { id: productId, organizationId },
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    // Verificar que la bodega existe
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, organizationId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Bodega con ID ${warehouseId} no encontrada`);
    }

    // Determinar si es entrada o salida
    const isEntry = [
      MovementType.IN_PURCHASE,
      MovementType.IN_ADJUSTMENT,
      MovementType.IN_RETURN,
      MovementType.IN_TRANSFER,
    ].includes(movementType);

    const quantityToApply = isEntry ? Math.abs(quantity) : -Math.abs(quantity);

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Obtener o crear stock item
      let stockItem = await tx.stockItem.findFirst({
        where: {
          organizationId,
          productId,
          warehouseId,
        },
      });

      if (!stockItem) {
        // Si es salida y no hay stock, error
        if (!isEntry) {
          throw new BadRequestException(
            `No hay stock registrado para este producto en esta bodega`,
          );
        }

        // Crear stock item para entrada
        stockItem = await tx.stockItem.create({
          data: {
            organizationId,
            productId,
            warehouseId,
            quantity: 0,
            reserved: 0,
          },
        });
      }

      // Validar stock suficiente para salidas
      if (!isEntry) {
        const availableStock = stockItem.quantity - stockItem.reserved;
        if (availableStock < Math.abs(quantityToApply)) {
          throw new BadRequestException(
            `Stock insuficiente. Disponible: ${availableStock}, Requerido: ${Math.abs(quantityToApply)}`,
          );
        }
      }

      // Actualizar stock
      const newQuantity = stockItem.quantity + quantityToApply;
      
      if (newQuantity < 0) {
        throw new BadRequestException('El stock no puede ser negativo');
      }

      const updatedStockItem = await tx.stockItem.update({
        where: { id: stockItem.id },
        data: { quantity: newQuantity },
      });

      // Registrar movimiento
      const movement = await tx.stockMovement.create({
        data: {
          organizationId,
          productId,
          warehouseId,
          movementType,
          quantity: quantityToApply,
          balanceAfter: newQuantity,
          referenceId,
          referenceType,
          notes,
          createdBy,
        },
      });

      return { movement, stockItem: updatedStockItem };
    });
  }

  async getMovements(
    organizationId: string,
    filters?: {
      productId?: string;
      warehouseId?: string;
      movementType?: MovementType;
      referenceId?: string;
    },
  ) {
    const where: any = { organizationId };

    if (filters?.productId) {
      where.productId = filters.productId;
    }

    if (filters?.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    if (filters?.movementType) {
      where.movementType = filters.movementType;
    }

    if (filters?.referenceId) {
      where.referenceId = filters.referenceId;
    }

    return this.prisma.stockMovement.findMany({
      where,
      include: {
        product: true,
        warehouse: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==========================================
  // Stock Adjustment Methods
  // ==========================================

  async createAdjustment(
    organizationId: string,
    dto: CreateAdjustmentDto,
    requestedBy: string,
  ) {
    const { warehouseId, reason, notes, items } = dto;

    // Verificar que la bodega existe
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, organizationId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Bodega con ID ${warehouseId} no encontrada`);
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Crear ajuste
      const adjustment = await tx.stockAdjustment.create({
        data: {
          organizationId,
          warehouseId,
          reason,
          notes,
          requestedBy,
          status: AdjustmentStatus.PENDING,
        },
      });

      // Crear items del ajuste
      const adjustmentItems: any[] = [];
      
      for (const item of items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, organizationId },
        });

        if (!product) {
          throw new NotFoundException(`Producto con ID ${item.productId} no encontrado`);
        }

        // Obtener stock actual
        const stockItem = await tx.stockItem.findFirst({
          where: {
            organizationId,
            productId: item.productId,
            warehouseId,
          },
        });

        const expectedQuantity = stockItem ? stockItem.quantity : 0;
        const difference = item.countedQuantity - expectedQuantity;

        const adjustmentItem = await tx.stockAdjustmentItem.create({
          data: {
            adjustmentId: adjustment.id,
            productId: item.productId,
            organizationId,
            expectedQuantity,
            countedQuantity: item.countedQuantity,
            difference,
          },
        });

        adjustmentItems.push(adjustmentItem);
      }

      return { ...adjustment, items: adjustmentItems };
    });
  }

  async approveAdjustment(
    organizationId: string,
    adjustmentId: string,
    approvedBy: string,
  ) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Obtener ajuste
      const adjustment = await tx.stockAdjustment.findFirst({
        where: { id: adjustmentId, organizationId },
        include: { items: true, warehouse: true },
      });

      if (!adjustment) {
        throw new NotFoundException(`Ajuste con ID ${adjustmentId} no encontrado`);
      }

      if (adjustment.status !== AdjustmentStatus.PENDING) {
        throw new ConflictException(
          `El ajuste ya está ${adjustment.status.toLowerCase()}`,
        );
      }

      // Procesar cada item
      for (const item of adjustment.items) {
        if (item.difference !== 0) {
          const movementType = item.difference > 0 
            ? MovementType.IN_ADJUSTMENT 
            : MovementType.OUT_ADJUSTMENT;

          // Registrar movimiento
          const stockItem = await tx.stockItem.findFirst({
            where: {
              organizationId,
              productId: item.productId,
              warehouseId: adjustment.warehouseId,
            },
          });

          let newQuantity: number;
          
          if (!stockItem) {
            // Crear stock item si no existe (solo para diferencias positivas)
            if (item.difference > 0) {
              await tx.stockItem.create({
                data: {
                  organizationId,
                  productId: item.productId,
                  warehouseId: adjustment.warehouseId,
                  quantity: item.difference,
                  reserved: 0,
                },
              });
              newQuantity = item.difference;
            } else {
              continue; // No hay stock para ajustar negativamente
            }
          } else {
            newQuantity = stockItem.quantity + item.difference;
            
            if (newQuantity < 0) {
              throw new BadRequestException(
                `Stock insuficiente para producto ${item.productId}`,
              );
            }

            await tx.stockItem.update({
              where: { id: stockItem.id },
              data: { quantity: newQuantity },
            });
          }

          await tx.stockMovement.create({
            data: {
              organizationId,
              productId: item.productId,
              warehouseId: adjustment.warehouseId,
              movementType,
              quantity: item.difference,
              balanceAfter: newQuantity,
              referenceId: adjustment.id,
              referenceType: 'ADJUSTMENT',
              notes: `Ajuste: ${adjustment.reason}`,
              createdBy: approvedBy,
            },
          });
        }
      }

      // Actualizar estado del ajuste
      return tx.stockAdjustment.update({
        where: { id: adjustmentId },
        data: {
          status: AdjustmentStatus.APPROVED,
          approvedBy,
          approvedAt: new Date(),
        },
        include: { items: true },
      });
    });
  }

  async rejectAdjustment(
    organizationId: string,
    adjustmentId: string,
    rejectedBy: string,
    rejectionReason?: string,
  ) {
    const adjustment = await this.prisma.stockAdjustment.findFirst({
      where: { id: adjustmentId, organizationId },
    });

    if (!adjustment) {
      throw new NotFoundException(`Ajuste con ID ${adjustmentId} no encontrado`);
    }

    if (adjustment.status !== AdjustmentStatus.PENDING) {
      throw new ConflictException(
        `El ajuste ya está ${adjustment.status.toLowerCase()}`,
      );
    }

    return this.prisma.stockAdjustment.update({
      where: { id: adjustmentId },
      data: {
        status: AdjustmentStatus.REJECTED,
        approvedBy: rejectedBy,
        approvedAt: new Date(),
        notes: rejectionReason 
          ? `${adjustment.notes || ''}\nRechazo: ${rejectionReason}` 
          : adjustment.notes,
      },
      include: { items: true },
    });
  }

  async getAdjustments(
    organizationId: string,
    filters?: {
      warehouseId?: string;
      status?: AdjustmentStatus;
    },
  ) {
    const where: any = { organizationId };

    if (filters?.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.stockAdjustment.findMany({
      where,
      include: {
        warehouse: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAdjustmentById(organizationId: string, id: string) {
    const adjustment = await this.prisma.stockAdjustment.findFirst({
      where: { id, organizationId },
      include: {
        warehouse: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!adjustment) {
      throw new NotFoundException(`Ajuste con ID ${id} no encontrado`);
    }

    return adjustment;
  }
}
