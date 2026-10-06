import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { StockMovementService } from '../stock-movements/stock-movements.service';
import {
  CreateSaleDto,
  UpdateSaleDto,
  ProcessPaymentDto,
  SaleStatus,
  SaleType,
} from './dto/create-sale.dto';
import { MovementReason, MovementType, PaymentMethod, PaymentStatus, SaleStatus as PrismaSaleStatus } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private stockMovementService: StockMovementService,
  ) {}

  async create(organizationId: string, userId: string, dto: CreateSaleDto) {
    if (!dto.items.length) {
      throw new BadRequestException('A sale must contain at least one item');
    }
    if (dto.customerId) await this.validateCustomer(organizationId, dto.customerId);
    await this.validateProducts(organizationId, dto.items.map((item) => item.productId));

    // Usar transacción para evitar condición de carrera en generateSaleNumber
    return this.prisma.$transaction(async (tx) => {
      const saleNumber = await this.generateSaleNumberInTransaction(tx, organizationId);
      const totals = this.calculateTotals(dto.items, dto.discount ?? 0);

      return tx.sale.create({
        data: {
          organizationId,
          saleNumber,
          customerId: dto.customerId,
          type: dto.type || SaleType.VENTA_MOSTRADOR,
          status: PrismaSaleStatus.BORRADOR,
          deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
          paymentTerm: dto.paymentTerm || 'CONTADO',
          paymentDueDate: dto.paymentDueDate ? new Date(dto.paymentDueDate) : null,
          subtotal: totals.subtotal,
          taxRate: dto.taxRate ?? 0.18,
          taxAmount: totals.taxAmount,
          discount: totals.discount,
          total: totals.total,
          amountPaid: 0,
          amountPending: totals.total,
          currency: dto.currency || 'PEN',
          notes: dto.notes,
          internalNotes: dto.internalNotes,
          soldBy: userId,
          items: {
            create: totals.items,
          },
        },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
              batch: true,
            },
          },
        },
      });
    });
  }

  async findAll(
    organizationId: string,
    status?: SaleStatus,
    customerId?: string,
  ) {
    const where: any = { organizationId };

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    return this.prisma.sale.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { saleDate: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            batch: true,
          },
        },
        stockMovements: true,
        payments: true,
        electronicDocuments: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    return sale;
  }

  async update(organizationId: string, id: string, dto: UpdateSaleDto) {
    const sale = await this.findOne(organizationId, id);

    const existing = await this.prisma.sale.findUnique({
      where: { id },
      select: { status: true },
    });

    if (
      existing &&
      [
        PrismaSaleStatus.COMPLETADA,
        PrismaSaleStatus.CANCELADA,
        PrismaSaleStatus.DEVUELTA_TOTAL,
      ].includes(existing.status as any)
    ) {
      throw new BadRequestException(
        'Cannot update a completed, cancelled or fully returned sale',
      );
    }

    if (dto.customerId) await this.validateCustomer(organizationId, dto.customerId);
    if (dto.status && dto.status !== sale.status) {
      if (sale.status !== PrismaSaleStatus.BORRADOR || dto.status !== PrismaSaleStatus.CONFIRMADA) {
        throw new BadRequestException('Only draft sales can be confirmed');
      }
    }

    return this.prisma.sale.update({
      where: { id },
      data: dto,
    });
  }

  async complete(organizationId: string, userId: string, id: string) {
    const sale = await this.findOne(organizationId, id);

    if (sale.status !== PrismaSaleStatus.CONFIRMADA) {
      throw new BadRequestException('Sale must be confirmed before completing');
    }

    // Usar transacción para asegurar consistencia en todas las operaciones de stock
    return this.prisma.$transaction(async (tx) => {
      // Procesar cada ítem de la venta
      for (const saleItem of sale.items) {
        const quantity = saleItem.quantity;

        // Delegar al StockMovementService que maneja consistentemente lotes e inventario
        // Nota: adjustStock usa su propia transacción, pero necesitamos pasar el tx
        // Para esto, usaremos una versión interna que acepta el transaction client
        const result = await this.stockMovementService.adjustStockInTransaction(
          tx,
          saleItem.productId,
          organizationId,
          -quantity, // Negativo para salida
          MovementReason.VENTA,
          userId,
          {
            batchId: saleItem.batchId || null,
            referenceType: 'SALE',
            referenceId: id,
            notes: `Venta ${sale.saleNumber}`,
          },
        );

        // Actualizar batchId en el ítem de venta si se asignó uno automáticamente
        if (result.batch && result.batch.id !== saleItem.batchId) {
          await tx.saleItem.update({
            where: { id: saleItem.id },
            data: { batchId: result.batch.id },
          });
        }
      }

      // Actualizar estado de la venta
      const completed = await tx.sale.updateMany({
        where: { id, organizationId, status: PrismaSaleStatus.CONFIRMADA },
        data: { status: PrismaSaleStatus.COMPLETADA },
      });
      if (completed.count !== 1) {
        throw new BadRequestException('Sale state changed while completing; reload and try again');
      }

      return tx.sale.findFirstOrThrow({
        where: { id, organizationId },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
              batch: true,
            },
          },
        },
      });
    });
  }

  async processPayment(
    organizationId: string,
    userId: string,
    saleId: string,
    dto: ProcessPaymentDto,
  ) {
    const sale = await this.findOne(organizationId, saleId);

    const payableStatuses: PrismaSaleStatus[] = [PrismaSaleStatus.CONFIRMADA, PrismaSaleStatus.COMPLETADA];
    if (!payableStatuses.includes(sale.status as PrismaSaleStatus)) {
      throw new BadRequestException('Only confirmed or completed sales can receive payments');
    }
    if (Number(sale.amountPending) <= 0) {
      throw new BadRequestException('Sale is already fully paid');
    }
    if (dto.amount > Number(sale.amountPending)) {
      throw new BadRequestException('Payment cannot exceed the outstanding balance');
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          organizationId,
          referenceType: 'SALE',
          referenceId: saleId,
          amount: dto.amount,
          method: dto.method as PaymentMethod,
          status: PaymentStatus.PAGADO,
          transactionId: dto.transactionId,
          bankName: dto.bankName,
          cardLastFour: dto.cardLastFour,
          notes: dto.notes,
          processedBy: userId,
        },
      });

      const updated = await tx.sale.updateMany({
        where: { id: saleId, organizationId, amountPending: { gte: dto.amount } },
        data: { amountPaid: { increment: dto.amount }, amountPending: { decrement: dto.amount } },
      });
      if (updated.count !== 1) {
        throw new BadRequestException('The outstanding balance changed; reload and try again');
      }

      const updatedSale = await tx.sale.findFirstOrThrow({
        where: { id: saleId, organizationId },
        include: { customer: true, items: { include: { product: true } }, payments: true },
      });
      return { payment, sale: updatedSale };
    });
  }

  async cancel(organizationId: string, id: string) {
    const sale = await this.findOne(organizationId, id);

    if (
      [
        PrismaSaleStatus.CANCELADA,
        PrismaSaleStatus.DEVUELTA_TOTAL,
      ].includes(sale.status as any)
    ) {
      throw new BadRequestException('Sale is already cancelled or fully returned');
    }

    if (sale.status === PrismaSaleStatus.COMPLETADA || Number(sale.amountPaid) > 0) {
      throw new BadRequestException('A completed or paid sale cannot be cancelled without a refund');
    }

    const updated = await this.prisma.sale.updateMany({
      where: { id, organizationId, status: { in: [PrismaSaleStatus.BORRADOR, PrismaSaleStatus.CONFIRMADA] }, amountPaid: 0 },
      data: { status: PrismaSaleStatus.CANCELADA },
    });
    if (!updated.count) throw new BadRequestException('Sale state changed; reload and try again');
    return this.findOne(organizationId, id);
  }

  async remove(organizationId: string, id: string) {
    const sale = await this.findOne(organizationId, id);

    if (![PrismaSaleStatus.BORRADOR].includes(sale.status as any)) {
      throw new BadRequestException('Can only delete draft sales');
    }

    return this.prisma.sale.delete({
      where: { id },
    });
  }

  private async generateSaleNumberInTransaction(tx: any, organizationId: string): Promise<string> {
    const prefix = 'V';
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Usar findFirst con lock para evitar condición de carrera
    // Prisma usa SELECT ... FOR UPDATE automáticamente en transacciones para PostgreSQL
    const lastSale = await tx.sale.findFirst({
      where: {
        organizationId,
        saleNumber: {
          startsWith: `${prefix}-${year}${month}-`,
        },
      },
      orderBy: { saleNumber: 'desc' },
      // Usar mode: 'readcommitted' o aislamiento serializable si es necesario
    });

    let sequence = 1;
    if (lastSale) {
      const lastNumber = parseInt(lastSale.saleNumber.split('-')[2]);
      sequence = lastNumber + 1;
    }

    return `${prefix}-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  private async generateSaleNumber(organizationId: string): Promise<string> {
    const prefix = 'V';
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const lastSale = await this.prisma.sale.findFirst({
      where: {
        organizationId,
        saleNumber: {
          startsWith: `${prefix}-${year}${month}-`,
        },
      },
      orderBy: { saleNumber: 'desc' },
    });

    let sequence = 1;
    if (lastSale) {
      const lastNumber = parseInt(lastSale.saleNumber.split('-')[2]);
      sequence = lastNumber + 1;
    }

    return `${prefix}-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }

  private calculateTotals(items: CreateSaleDto['items'], globalDiscount: number) {
    let subtotal = 0;
    let taxAmount = 0;
    let itemDiscount = 0;
    const calculatedItems = items.map((item) => {
      if (item.quantity <= 0) throw new BadRequestException('Sale quantity must be greater than zero');
      const lineSubtotal = this.roundAmount(item.quantity * item.unitPrice);
      const lineDiscount = this.roundAmount(item.discount ?? 0);
      if (lineDiscount > lineSubtotal) throw new BadRequestException('Item discount cannot exceed its subtotal');
      const rate = item.taxRate ?? 0.18;
      if (rate < 0 || rate > 1) throw new BadRequestException('Tax rate must be between 0 and 1');
      const lineTax = this.roundAmount((lineSubtotal - lineDiscount) * rate);
      const lineTotal = this.roundAmount(lineSubtotal - lineDiscount + lineTax);
      subtotal += lineSubtotal;
      taxAmount += lineTax;
      itemDiscount += lineDiscount;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: lineDiscount,
        taxRate: rate,
        subtotal: lineSubtotal,
        taxAmount: lineTax,
        total: lineTotal,
        batchId: item.batchId || null,
        notes: item.notes,
      };
    });
    subtotal = this.roundAmount(subtotal);
    taxAmount = this.roundAmount(taxAmount);
    globalDiscount = this.roundAmount(globalDiscount);
    const discount = this.roundAmount(itemDiscount + globalDiscount);
    const total = this.roundAmount(subtotal + taxAmount - discount);
    if (globalDiscount > subtotal - itemDiscount + taxAmount) {
      throw new BadRequestException('Global discount exceeds the sale amount');
    }
    return { items: calculatedItems, subtotal, taxAmount, discount, total };
  }

  private roundAmount(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private async validateProducts(organizationId: string, productIds: string[]) {
    const uniqueIds = [...new Set(productIds)];
    if (uniqueIds.length !== productIds.length) {
      throw new BadRequestException('A product can only appear once in a sale; combine its quantity');
    }
    const products = await this.prisma.product.findMany({
      where: { id: { in: uniqueIds }, organizationId, isActive: true },
      select: { id: true },
    });
    if (products.length !== uniqueIds.length) {
      throw new BadRequestException('One or more products are inactive or outside the current organization');
    }
  }

  private async validateCustomer(organizationId: string, customerId: string) {
    const customer = await this.prisma.businessEntity.findFirst({
      where: { id: customerId, organizationId, isActive: true, entityType: { in: ['CLIENTE', 'AMBOS'] } },
      select: { id: true },
    });
    if (!customer) throw new BadRequestException('Customer not found, inactive, or outside the current organization');
  }
}
