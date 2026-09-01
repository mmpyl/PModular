import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  PurchaseOrderStatus,
} from './dto/create-purchase-order.dto';
import { MovementReason, MovementType } from '@prisma/client';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  async create(organizationId: string, userId: string, dto: CreatePurchaseOrderDto) {
    const orderNumber = await this.generateOrderNumber(organizationId);

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

    return this.prisma.purchaseOrder.create({
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
      ].includes(existing.status)
    ) {
      throw new BadRequestException(
        'Cannot update a completed or cancelled purchase order',
      );
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: dto,
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
      await this.prisma.purchaseOrderItem.update({
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

      // Crear lote si existe número de lote
      let batchId: string | null = null;
      if (receiveItem.batchNumber) {
        const batch = await this.prisma.batch.upsert({
          where: {
            productId_batchNumber_organizationId: {
              productId: orderItem.productId,
              batchNumber: receiveItem.batchNumber,
              organizationId,
            },
          },
          update: {
            currentQuantity: {
              increment: quantityReceived,
            },
          },
          create: {
            productId: orderItem.productId,
            organizationId,
            batchNumber: receiveItem.batchNumber,
            serialNumber: null,
            manufacturingDate: null,
            expirationDate: receiveItem.expirationDate
              ? new Date(receiveItem.expirationDate)
              : null,
            status: 'ACTIVO',
            initialQuantity: quantityReceived,
            currentQuantity: quantityReceived,
            unitCost: orderItem.unitCost,
            location: null,
          },
        });
        batchId = batch.id;
      }

      // Crear movimiento de stock
      await this.prisma.stockMovement.create({
        data: {
          organizationId,
          productId: orderItem.productId,
          type: MovementType.INGRESO,
          reason: MovementReason.COMPRA,
          quantity: quantityReceived,
          isPositive: true,
          batchId,
          referenceType: 'PURCHASE_ORDER',
          referenceId: orderId,
          notes: `Recepción de orden ${order.orderNumber}`,
          performedBy: userId,
        },
      });

      // Actualizar inventario
      await this.inventoryService.adjustStock(
        organizationId,
        orderItem.productId,
        quantityReceived,
        'COMPRA',
        userId,
        `Recepción de orden ${order.orderNumber}`,
        batchId,
      );
    }

    // Actualizar estado de la orden
    const updatedOrder = await this.prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

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

    return this.prisma.purchaseOrder.update({
      where: { id: orderId },
      data: {
        status: newStatus,
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
  }

  async cancel(organizationId: string, id: string) {
    const order = await this.findOne(organizationId, id);

    if (
      [
        PurchaseOrderStatus.COMPLETADA,
        PurchaseOrderStatus.CANCELADA,
      ].includes(order.status)
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
      ![PurchaseOrderStatus.BORRADOR].includes(order.status)
    ) {
      throw new BadRequestException(
        'Can only delete draft purchase orders',
      );
    }

    return this.prisma.purchaseOrder.delete({
      where: { id },
    });
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
