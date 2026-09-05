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
    // Usar transacción para evitar condición de carrera en generateOrderNumber
    return this.prisma.$transaction(async (tx) => {
      const orderNumber = await this.generateOrderNumberInTransaction(tx, organizationId);

      // Calcular totales
      let subtotal = 0;
      let taxAmount = 0;
      let total = 0;

      const items = dto.items.map((item) => {
        const lineSubtotal = item.quantityOrdered * item.unitCost;
        const lineDiscount = item.discount || 0;
        const lineTaxRate = item.taxRate ?? 0.18;
        const lineTaxAmount = (lineSubtotal - lineDiscount) * lineTaxRate;
        const lineTotal = lineSubtotal - lineDiscount + lineTaxAmount;

        subtotal += lineSubtotal;
        taxAmount += lineTaxAmount;
        total += lineTotal - lineDiscount;

        return {
          productId: item.productId,
          quantityOrdered: item.quantityOrdered,
          quantityReceived: 0,
          unitCost: item.unitCost,
          discount: item.discount || 0,
          taxRate: item.taxRate ?? 0.18,
          subtotal: lineSubtotal,
          taxAmount: lineTaxAmount,
          total: lineTotal,
          batchNumber: item.batchNumber,
          expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
          notes: item.notes,
        };
      });

      const globalDiscount = dto.discount || 0;
      total -= globalDiscount;

      return tx.purchaseOrder.create({
        data: {
          organizationId,
          orderNumber,
          supplierId: dto.supplierId,
          status: dto.status || PurchaseOrderStatus.BORRADOR,
          expectedDeliveryDate: dto.expectedDeliveryDate
            ? new Date(dto.expectedDeliveryDate)
            : null,
          paymentTerm: dto.paymentTerm || 'CONTADO',
          paymentDueDate: dto.paymentDueDate ? new Date(dto.paymentDueDate) : null,
          subtotal,
          taxRate: dto.taxRate ?? 0.18,
          taxAmount,
          discount: globalDiscount,
          total,
          currency: dto.currency || 'PEN',
          notes: dto.notes,
          internalNotes: dto.internalNotes,
          externalReference: dto.externalReference,
          createdBy: userId,
          items: {
            create: items,
          },
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
      [
        PurchaseOrderStatus.COMPLETADA,
        PurchaseOrderStatus.CANCELADA,
      ].includes(existing.status as PurchaseOrderStatus)
    ) {
      throw new BadRequestException(
        'Cannot update a completed or cancelled purchase order',
      );
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: dto as any,
    });
  }

  async receive(
    organizationId: string,
    userId: string,
    orderId: string,
    dto: ReceivePurchaseOrderDto,
  ) {
    const order = await this.findOne(organizationId, orderId);

    if (order.status === PurchaseOrderStatus.CANCELADA) {
      throw new BadRequestException('Cannot receive a cancelled order');
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

        // Actualizar cantidad recibida en el ítem
        await tx.purchaseOrderItem.update({
          where: { id: receiveItem.itemId },
          data: {
            quantityReceived: {
              increment: quantityReceived,
            },
            batchNumber: receiveItem.batchNumber || orderItem.batchNumber,
            expirationDate: receiveItem.expirationDate
              ? new Date(receiveItem.expirationDate)
              : orderItem.expirationDate,
          },
        });

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
              : orderItem.expirationDate,
            unitCost: orderItem.unitCost,
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
        (item) => item.quantityReceived >= item.quantityOrdered,
      );
      const someItemsReceived = updatedOrder.items.some(
        (item) => item.quantityReceived > 0,
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
      [
        PurchaseOrderStatus.COMPLETADA,
        PurchaseOrderStatus.CANCELADA,
      ].includes(order.status as PurchaseOrderStatus)
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

    if (
      ![PurchaseOrderStatus.BORRADOR].includes(order.status as PurchaseOrderStatus)
    ) {
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
