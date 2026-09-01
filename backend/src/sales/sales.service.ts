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
    const saleNumber = await this.generateSaleNumber(organizationId);

    // Calcular totales
    let subtotal = 0;
    let taxAmount = 0;
    let total = 0;

    const items = await Promise.all(
      dto.items.map(async (item) => {
        const lineSubtotal = item.quantity * item.unitPrice;
        const lineDiscount = item.discount || 0;
        const lineTaxRate = item.taxRate ?? 0.18;
        const lineTaxAmount = (lineSubtotal - lineDiscount) * lineTaxRate;
        const lineTotal = lineSubtotal - lineDiscount + lineTaxAmount;

        subtotal += lineSubtotal;
        taxAmount += lineTaxAmount;
        total += lineTotal;

        // Verificar stock si hay batchId específico
        let batchId = item.batchId || null;
        
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          taxRate: item.taxRate ?? 0.18,
          subtotal: lineSubtotal,
          taxAmount: lineTaxAmount,
          total: lineTotal,
          batchId,
          notes: item.notes,
        };
      }),
    );

    const globalDiscount = dto.discount || 0;
    total -= globalDiscount;

    return this.prisma.sale.create({
      data: {
        organizationId,
        saleNumber,
        customerId: dto.customerId,
        type: dto.type || SaleType.VENTA_MOSTRADOR,
        status: dto.status || SaleStatus.CONFIRMADA,
        deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : null,
        paymentTerm: dto.paymentTerm || 'CONTADO',
        paymentDueDate: dto.paymentDueDate ? new Date(dto.paymentDueDate) : null,
        subtotal,
        taxRate: dto.taxRate ?? 0.18,
        taxAmount,
        discount: globalDiscount,
        total,
        amountPaid: 0,
        amountPending: total,
        currency: dto.currency || 'PEN',
        notes: dto.notes,
        internalNotes: dto.internalNotes,
        soldBy: userId,
        items: {
          create: items,
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
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    return sale;
  }

  async update(organizationId: string, id: string, dto: UpdateSaleDto) {
    await this.findOne(organizationId, id);

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

    return this.prisma.sale.update({
      where: { id },
      data: dto,
    });
  }

  async complete(organizationId: string, userId: string, id: string) {
    const sale = await this.findOne(organizationId, id);

    if (sale.status !== SaleStatus.CONFIRMADA) {
      throw new BadRequestException('Sale must be confirmed before completing');
    }

    // Usar transacción para asegurar consistencia en todas las operaciones de stock
    await this.prisma.$transaction(async (tx) => {
      // Procesar cada ítem de la venta
      for (const saleItem of sale.items) {
        const quantity = saleItem.quantity;

        // Delegar al StockMovementService que maneja consistentemente lotes e inventario
        const result = await this.stockMovementService.adjustStock(
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
    });

    // Actualizar estado de la venta
    return this.prisma.sale.update({
      where: { id },
      data: {
        status: SaleStatus.COMPLETADA,
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
  }

  async processPayment(
    organizationId: string,
    userId: string,
    saleId: string,
    dto: ProcessPaymentDto,
  ) {
    const sale = await this.findOne(organizationId, saleId);

    if (Number(sale.amountPending) <= 0) {
      throw new BadRequestException('Sale is already fully paid');
    }

    const paymentAmount = Math.min(dto.amount, Number(sale.amountPending));

    // Crear pago
    const payment = await this.prisma.payment.create({
      data: {
        organizationId,
        referenceType: 'SALE',
        referenceId: saleId,
        amount: paymentAmount,
        method: dto.method as PaymentMethod,
        status: PaymentStatus.PAGADO,
        transactionId: dto.transactionId,
        bankName: dto.bankName,
        cardLastFour: dto.cardLastFour,
        notes: dto.notes,
        processedBy: userId,
      },
    });

    // Actualizar montos de la venta
    const newAmountPaid = Number(sale.amountPaid) + paymentAmount;
    const newAmountPending = Number(sale.amountPending) - paymentAmount;

    const updatedSale = await this.prisma.sale.update({
      where: { id: saleId },
      data: {
        amountPaid: newAmountPaid,
        amountPending: newAmountPending,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
    });

    return { payment, sale: updatedSale };
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

    return this.prisma.sale.update({
      where: { id },
      data: { status: PrismaSaleStatus.CANCELADA },
    });
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
}
