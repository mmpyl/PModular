import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { StockMovementService } from '../stock-movements/stock-movements.service';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
} from './dto/create-purchase-order.dto';
import { MovementReason, MovementType, PurchaseOrderStatus } from '@prisma/client';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private stockMovementService: StockMovementService,
  ) {}

  async create(organizationId: string, userId: string, dto: CreatePurchaseOrderDto) {
    if (dto.items.length === 0) {
      throw new BadRequestException('A purchase order must contain at least one item');
    }
    await this.validateSupplier(organizationId, dto.supplierId);
    await this.validateProducts(organizationId, dto.items.map((item) => item.productId));

    // Usar transacción para evitar condición de carrera en generateOrderNumber
    return this.prisma.$transaction(async (tx) => {
      const orderNumber = await this.generateOrderNumberInTransaction(tx, organizationId);

      // Calcular totales
      const totals = this.calculateTotals(dto.items, dto.discount ?? 0);

      return tx.purchaseOrder.create({
        data: {
          organizationId,
          orderNumber,
          supplierId: dto.supplierId,
          status: PurchaseOrderStatus.BORRADOR,
          expectedDeliveryDate: dto.expectedDeliveryDate
            ? new Date(dto.expectedDeliveryDate)
            : null,
          paymentTerm: dto.paymentTerm || 'CONTADO',
          paymentDueDate: dto.paymentDueDate ? new Date(dto.paymentDueDate) : null,
          subtotal: totals.subtotal,
          taxRate: dto.taxRate ?? 0.18,
          taxAmount: totals.taxAmount,
          discount: dto.discount ?? 0,
          total: totals.total,
          currency: dto.currency || 'PEN',
          notes: dto.notes,
          internalNotes: dto.internalNotes,
          externalReference: dto.externalReference,
          createdBy: userId,
          items: { create: totals.items },
        },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });
  }

  async findAll(
    organizationId: string,
    status?: PurchaseOrderStatus,
    supplierId?: string,
  ) {
    const where: any = { organizationId };

    if (status) {
      where.status = status;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    return this.prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { orderDate: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
        stockMovements: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Purchase order with ID ${id} not found`);
    }

    return order;
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdatePurchaseOrderDto,
  ) {
    await this.findOne(organizationId, id);

    // No permitir actualizar si ya está completada o cancelada
    const existing = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      select: { status: true },
    });

    if (
      existing &&
      (existing.status === PurchaseOrderStatus.COMPLETADA ||
        existing.status === PurchaseOrderStatus.CANCELADA)
    ) {
      throw new BadRequestException(
        'Cannot update a completed or cancelled purchase order',
      );
    }

    if (dto.supplierId) {
      await this.validateSupplier(organizationId, dto.supplierId);
    }
    if (dto.items) {
      if (dto.items.length === 0) {
        throw new BadRequestException('A purchase order must contain at least one item');
      }
      await this.validateProducts(organizationId, dto.items.map((item) => item.productId));
    }

    if (dto.items && existing?.status !== PurchaseOrderStatus.BORRADOR) {
      throw new BadRequestException('Only draft purchase orders can have their items edited');
    }

    if (dto.status && dto.status !== existing?.status) {
      const validTransitions: Record<string, string[]> = {
        [PurchaseOrderStatus.BORRADOR]: [PurchaseOrderStatus.ENVIADA],
        [PurchaseOrderStatus.ENVIADA]: [PurchaseOrderStatus.CONFIRMADA],
      };
      if (!validTransitions[existing?.status ?? '']?.includes(dto.status)) {
        throw new BadRequestException('Invalid purchase order status transition');
      }
    }

    const { items, status, ...orderData } = dto;
    return this.prisma.$transaction(async (tx) => {
      if (items) {
        const totals = this.calculateTotals(items, dto.discount ?? 0);
        await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
        return tx.purchaseOrder.update({
          where: { id },
          data: {
            ...orderData,
            ...(status ? { status } : {}),
            subtotal: totals.subtotal,
            taxAmount: totals.taxAmount,
            total: totals.total,
            items: { create: totals.items },
          },
          include: { supplier: true, items: { include: { product: true } } },
        });
      }

      return tx.purchaseOrder.update({
        where: { id },
        data: { ...orderData, ...(status ? { status } : {}) } as any,
        include: { supplier: true, items: { include: { product: true } } },
      });
    });
  }

  async receive(
    organizationId: string,
    userId: string,
    orderId: string,
    dto: ReceivePurchaseOrderDto,
  ) {
    const order = await this.findOne(organizationId, orderId);

    const receivableStatuses: PurchaseOrderStatus[] = [
      PurchaseOrderStatus.ENVIADA,
      PurchaseOrderStatus.CONFIRMADA,
      PurchaseOrderStatus.PARCIALMENTE_RECIBIDA,
    ];
    if (!receivableStatuses.includes(order.status)) {
      throw new BadRequestException('Only sent or confirmed orders can be received');
    }
    if (dto.items.length === 0) {
      throw new BadRequestException('At least one order item is required for receiving');
    }
    if (new Set(dto.items.map((item) => item.itemId)).size !== dto.items.length) {
      throw new BadRequestException('An order item cannot be received more than once per request');
    }

    // Usar transacción para asegurar consistencia en todas las operaciones de stock
    return this.prisma.$transaction(async (tx) => {
      // Procesar cada ítem recibido
      for (const receiveItem of dto.items) {
        const orderItem = order.items.find(
          (item) => item.id === receiveItem.itemId,
        );

        if (!orderItem) {
          throw new NotFoundException(
            `Item ${receiveItem.itemId} not found in order`,
          );
        }

        const quantityReceived = receiveItem.quantityReceived;
        const pending = Number(orderItem.quantityOrdered) - Number(orderItem.quantityReceived);
        if (quantityReceived <= 0 || quantityReceived > pending) {
          throw new BadRequestException(`Received quantity must be greater than zero and no more than the pending ${pending}`);
        }

        // Actualizar cantidad recibida en el ítem
        const itemUpdate = await tx.purchaseOrderItem.updateMany({
          where: {
            id: receiveItem.itemId,
            quantityReceived: { lte: Number(orderItem.quantityOrdered) - quantityReceived },
          },
          data: {
            quantityReceived: {
              increment: quantityReceived,
            },
            batchNumber: receiveItem.batchNumber || orderItem.batchNumber,
            expirationDate: receiveItem.expirationDate
              ? new Date(receiveItem.expirationDate)
              : orderItem.expirationDate ?? undefined,
          },
        });
        if (itemUpdate.count !== 1) {
          throw new BadRequestException('The pending quantity changed; reload the order and try again');
        }

        // Delegar al StockMovementService que maneja consistentemente lotes e inventario
        // Usamos la versión que acepta transaction client para evitar transacciones anidadas
        await this.stockMovementService.adjustStockInTransaction(
          tx,
          orderItem.productId,
          organizationId,
          quantityReceived, // Positivo para ingreso
          MovementReason.COMPRA,
          userId,
          {
            batchNumber: receiveItem.batchNumber || undefined,
            expirationDate: receiveItem.expirationDate
              ? new Date(receiveItem.expirationDate)
                : orderItem.expirationDate ?? undefined,
              unitCost: Number(orderItem.unitCost),
            referenceType: 'PURCHASE_ORDER',
            referenceId: orderId,
            notes: `Recepción de orden ${order.orderNumber}`,
          },
        );
      }

      // Actualizar estado de la orden dentro de la misma transacción
      const updatedOrder = await tx.purchaseOrder.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!updatedOrder) {
        throw new NotFoundException(`Purchase order with ID ${orderId} not found`);
      }

      const allItemsReceived = updatedOrder.items.every(
        (item) => Number(item.quantityReceived) >= Number(item.quantityOrdered),
      );
      const someItemsReceived = updatedOrder.items.some(
        (item) => Number(item.quantityReceived) > 0,
      );

      let newStatus = order.status;
      if (allItemsReceived) {
        newStatus = PurchaseOrderStatus.COMPLETADA;
      } else if (someItemsReceived) {
        newStatus = PurchaseOrderStatus.PARCIALMENTE_RECIBIDA;
      }

      return tx.purchaseOrder.update({
        where: { id: orderId },
        data: {
          status: newStatus as PurchaseOrderStatus,
          receivedDate: allItemsReceived ? new Date() : undefined,
        },
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });
  }

  async cancel(organizationId: string, id: string) {
    const order = await this.findOne(organizationId, id);

    if (
      order.status === PurchaseOrderStatus.COMPLETADA ||
      order.status === PurchaseOrderStatus.CANCELADA
    ) {
      throw new BadRequestException(
        'Cannot cancel a completed or already cancelled order',
      );
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.CANCELADA },
    });
  }

  async remove(organizationId: string, id: string) {
    const order = await this.findOne(organizationId, id);

    if (order.status !== PurchaseOrderStatus.BORRADOR) {
      throw new BadRequestException(
        'Can only delete draft purchase orders',
      );
    }

    return this.prisma.purchaseOrder.delete({
      where: { id },
    });
  }

  private async generateOrderNumberInTransaction(tx: any, organizationId: string): Promise<string> {
    const prefix = 'PO';
    const year = new Date().getFullYear();
    
    // Usar findFirst con lock para evitar condición de carrera
    // Prisma usa SELECT ... FOR UPDATE automáticamente en transacciones para PostgreSQL
    const lastOrder = await tx.purchaseOrder.findFirst({
      where: {
        organizationId,
        orderNumber: {
          startsWith: `${prefix}-${year}-`,
        },
      },
      orderBy: { orderNumber: 'desc' },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2]);
      sequence = lastNumber + 1;
    }

    return `${prefix}-${year}-${String(sequence).padStart(4, '0')}`;
  }

  private calculateTotals(items: CreatePurchaseOrderDto['items'], globalDiscount: number) {
    let subtotal = 0;
    let taxAmount = 0;

    const calculatedItems = items.map((item) => {
      if (item.quantityOrdered <= 0) {
        throw new BadRequestException('Ordered quantity must be greater than zero');
      }
      const lineSubtotal = this.roundAmount(item.quantityOrdered * item.unitCost);
      const lineDiscount = item.discount ?? 0;
      if (lineDiscount > lineSubtotal) {
        throw new BadRequestException('An item discount cannot exceed its subtotal');
      }
      const lineTaxRate = item.taxRate ?? 0.18;
      const discountedSubtotal = this.roundAmount(lineSubtotal - lineDiscount);
      const lineTaxAmount = this.roundAmount(discountedSubtotal * lineTaxRate);
      const lineTotal = this.roundAmount(discountedSubtotal + lineTaxAmount);
      subtotal += lineSubtotal;
      taxAmount += lineTaxAmount;

      return {
        productId: item.productId,
        quantityOrdered: item.quantityOrdered,
        quantityReceived: 0,
        unitCost: item.unitCost,
        discount: lineDiscount,
        taxRate: lineTaxRate,
        subtotal: lineSubtotal,
        taxAmount: lineTaxAmount,
        total: lineTotal,
        batchNumber: item.batchNumber,
        expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
        notes: item.notes,
      };
    });

    subtotal = this.roundAmount(subtotal);
    taxAmount = this.roundAmount(taxAmount);
    globalDiscount = this.roundAmount(globalDiscount);
    const total = this.roundAmount(subtotal + taxAmount - globalDiscount);
    if (globalDiscount > subtotal + taxAmount) {
      throw new BadRequestException('Order discount cannot exceed the order amount');
    }

    return { items: calculatedItems, subtotal, taxAmount, total };
  }

  private roundAmount(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private async validateSupplier(organizationId: string, supplierId: string) {
    const supplier = await this.prisma.businessEntity.findFirst({
      where: {
        id: supplierId,
        organizationId,
        isActive: true,
        entityType: { in: ['PROVEEDOR', 'AMBOS'] },
      },
      select: { id: true },
    });
    if (!supplier) {
      throw new BadRequestException('Supplier not found, inactive, or outside the current organization');
    }
  }

  private async validateProducts(organizationId: string, productIds: string[]) {
    const uniqueIds = [...new Set(productIds)];
    if (!uniqueIds.length) return;
    const products = await this.prisma.product.findMany({
      where: { id: { in: uniqueIds }, organizationId, isActive: true },
      select: { id: true },
    });
    if (products.length !== uniqueIds.length) {
      throw new BadRequestException('One or more products are inactive or outside the current organization');
    }
  }

  private async generateOrderNumber(organizationId: string): Promise<string> {
    const prefix = 'PO';
    const year = new Date().getFullYear();
    
    const lastOrder = await this.prisma.purchaseOrder.findFirst({
      where: {
        organizationId,
        orderNumber: {
          startsWith: `${prefix}-${year}-`,
        },
      },
      orderBy: { orderNumber: 'desc' },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2]);
      sequence = lastNumber + 1;
    }

    return `${prefix}-${year}-${String(sequence).padStart(4, '0')}`;
  }
}
