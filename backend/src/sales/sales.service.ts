import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { StockMovementService } from '../stock-movements/stock-movements.service';
import { AccountService } from '../account/account.service';
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
    private accountService: AccountService,
  ) {}

  /** Días de crédito a partir del término de pago (Fase B1). */
  private creditDaysFromTerm(paymentTerm?: string | null): number {
    switch (paymentTerm) {
      case 'CREDITO_7_DIAS':
        return 7;
      case 'CREDITO_15_DIAS':
        return 15;
      case 'CREDITO_30_DIAS':
        return 30;
      case 'CREDITO_60_DIAS':
        return 60;
      case 'CREDITO_90_DIAS':
        return 90;
      default:
        return 0; // CONTADO / PERSONALIZADO (usa paymentDueDate explícito)
    }
  }

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

    // Fase B1 — cuenta corriente: validar límite de crédito antes de completar un fiado
    const isCreditSale =
      !!sale.customerId &&
      sale.paymentTerm !== 'CONTADO' &&
      Number(sale.amountPending) > 0;

    // Usar transacción para asegurar consistencia en todas las operaciones de stock
    return this.prisma.$transaction(async (tx) => {
      // Validación de límite de crédito DENTRO de la transacción y con bloqueo
      // exclusivo de la fila del cliente (SELECT ... FOR UPDATE). Sin esto, dos
      // ventas a crédito concurrentes podían leer el mismo currentBalance, pasar
      // ambas la validación y exceder el límite (race condition conocida).
      if (isCreditSale) {
        const customer = await tx.businessEntity.findFirst({
          where: { id: sale.customerId!, organizationId },
          select: { name: true, creditLimit: true, currentBalance: true },
        });
        if (customer?.creditLimit != null) {
          // Bloquea la fila hasta el commit: cualquier transacción concurrente
          // que intente completar otra venta fiada al mismo cliente quedará
          // esperando y verá el saldo ya actualizado.
          await tx.$executeRaw`SELECT id FROM business_entities WHERE id = ${sale.customerId!}::uuid FOR UPDATE`;

          // Releer el saldo DESPUÉS del lock: puede haber cambiado mientras
          // esperábamos por otra transacción.
          const locked = await tx.businessEntity.findUnique({
            where: { id: sale.customerId! },
            select: { name: true, creditLimit: true, currentBalance: true },
          });

          const projected = Number(locked?.currentBalance ?? customer.currentBalance) + Number(sale.amountPending);
          if (projected > Number(locked?.creditLimit ?? customer.creditLimit)) {
            throw new BadRequestException(
              `No se puede completar la venta: ${locked?.name ?? customer.name} excedería su límite de crédito ` +
                `(proyectado ${projected.toFixed(2)} > límite ${Number(locked?.creditLimit ?? customer.creditLimit).toFixed(2)}). ` +
                `Registra un abono o ajusta el límite.`,
            );
          }
        }
      }
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

      // Fase B1 — cuenta corriente: generar asiento CREDITO por el saldo pendiente
      // de una venta fiada (cliente + término distinto de CONTADO), con vencimiento
      // para alertas de mora. Mantiene currentBalance sincronizado.
      if (isCreditSale) {
        let dueDate: Date | null = sale.paymentDueDate ?? null;
        if (!dueDate) {
          const days = this.creditDaysFromTerm(sale.paymentTerm);
          if (days > 0) {
            dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + days);
          }
        }

        await this.accountService.createSaleLinkedEntry(tx, {
          organizationId,
          customerId: sale.customerId!,
          type: 'CREDITO',
          amount: Number(sale.amountPending),
          referenceType: 'SALE',
          referenceId: id,
          dueDate,
          description: `Venta fiada ${sale.saleNumber}`,
          createdBy: userId,
        });
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

<<<<<<< HEAD
    return this.prisma.$transaction(async (tx) => {
=======
    const paymentAmount = Math.min(dto.amount, Number(sale.amountPending));

    // Fase B1 — el pago debe ser transaccional: asiento DEBITO (abono) + saldo
    // actualizados de forma atómica junto con el registro del pago.
    const { payment, sale: updatedSale } = await this.prisma.$transaction(async (tx) => {
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540
      const payment = await tx.payment.create({
        data: {
          organizationId,
          referenceType: 'SALE',
          referenceId: saleId,
<<<<<<< HEAD
          amount: dto.amount,
=======
          amount: paymentAmount,
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540
          method: dto.method as PaymentMethod,
          status: PaymentStatus.PAGADO,
          transactionId: dto.transactionId,
          bankName: dto.bankName,
          cardLastFour: dto.cardLastFour,
          notes: dto.notes,
          processedBy: userId,
        },
      });
<<<<<<< HEAD
=======

      // Actualizar montos de la venta
      const newAmountPaid = Number(sale.amountPaid) + paymentAmount;
      const newAmountPending = Number(sale.amountPending) - paymentAmount;

      const updatedSale = await tx.sale.update({
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

      // Abono en cuenta corriente si la venta estaba fiada a un cliente
      if (sale.customerId) {
        await this.accountService.createSaleLinkedEntry(tx, {
          organizationId,
          customerId: sale.customerId,
          type: 'DEBITO',
          amount: paymentAmount,
          referenceType: 'PAYMENT',
          referenceId: payment.id,
          dueDate: null,
          description: `Abono a venta ${sale.saleNumber}`,
          createdBy: userId,
        });
      }

      return { payment, sale: updatedSale };
    });
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540

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
    // Nota: Prisma NO aplica SELECT ... FOR UPDATE automáticamente. Para locks explícitos en PostgreSQL,
    // se debe usar prisma.$executeRaw`SELECT ... FOR UPDATE` o aislamiento serializable.
    // En este caso, la transacción proporciona aislamiento suficiente para generación de números secuenciales.
    const lastSale = await tx.sale.findFirst({
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
