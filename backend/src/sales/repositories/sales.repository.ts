import { PrismaService } from '../../prisma.service';
import { Injectable } from '@nestjs/common';
import { Sale, SaleItem, Payment } from '@prisma/client';
import { CreateSaleDto, UpdateSaleDto } from '../dto/create-sale.dto';

@Injectable()
export class SalesRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string): Promise<Sale[]> {
    return this.prisma.sale.findMany({
      where: { organizationId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<Sale | null> {
    return this.prisma.sale.findUnique({
      where: { id, organizationId },
      include: {
        items: {
          include: {
            product: true,
            batch: true,
          },
        },
        payments: true,
      },
    });
  }

  async create(data: CreateSaleDto, userId: string, organizationId: string): Promise<Sale> {
    const { items, ...saleData } = data;

    // Calcular totales
    let subtotal = 0;
    let taxAmount = 0;
    let discount = 0;

    const saleItems = items.map((item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = item.discount || 0;
      const itemTaxRate = item.taxRate || 0;
      const itemTaxAmount = (itemSubtotal - itemDiscount) * (itemTaxRate / 100);
      const itemTotal = itemSubtotal - itemDiscount + itemTaxAmount;

      subtotal += itemSubtotal - itemDiscount;
      taxAmount += itemTaxAmount;
      discount += itemDiscount;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: itemDiscount,
        subtotal: itemSubtotal - itemDiscount,
        taxRate: itemTaxRate,
        taxAmount: itemTaxAmount,
        total: itemTotal,
        batchId: item.batchId,
      };
    });

    const total = subtotal + taxAmount;

    return this.prisma.sale.create({
      data: {
        ...saleData,
        organizationId,
        soldBy: userId,
        status: 'CONFIRMADA' as SaleStatus,
        subtotal,
        taxAmount,
        discount,
        total,
        items: {
          create: saleItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
    });
  }

  async update(id: string, data: UpdateSaleDto, organizationId: string): Promise<Sale> {
    return this.prisma.sale.update({
      where: { id, organizationId },
      data,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
    });
  }

  async complete(
    id: string,
    payments: { method: string; amount: number; reference?: string; notes?: string }[],
    userId: string,
    organizationId: string,
  ): Promise<Sale> {
    const sale = await this.prisma.sale.findUnique({
      where: { id, organizationId },
      include: { items: true },
    });

    if (!sale) {
      throw new Error('Venta no encontrada');
    }

    // Verificar que los pagos cubran el total
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid < sale.total.toNumber()) {
      throw new Error('El monto pagado no cubre el total de la venta');
    }

    // Actualizar estado y crear pagos
    const updatedSale = await this.prisma.sale.update({
      where: { id, organizationId },
      data: {
        status: 'COMPLETADA',
        payments: {
          create: payments.map((payment) => ({
            method: payment.method as any,
            amount: payment.amount,
            reference: payment.reference,
            notes: payment.notes,
            organizationId,
            referenceType: 'SALE',
            referenceId: id,
            processedBy: userId,
            status: 'COMPLETADO' as any,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
    });

    // Crear movimientos de stock para cada item
    for (const item of sale.items) {
      await this.prisma.stockMovement.create({
        data: {
          organizationId,
          productId: item.productId,
          type: 'SALIDA',
          reason: 'VENTA',
          quantity: item.quantity,
          isPositive: false,
          batchId: item.batchId,
          referenceType: 'SALE',
          referenceId: id,
          performedBy: userId,
        },
      });

      // Actualizar batch si existe
      if (item.batchId) {
        await this.prisma.batch.update({
          where: { id: item.batchId },
          data: {
            currentQuantity: {
              decrement: item.quantity.toNumber(),
            },
          },
        });
      }

      // Actualizar inventory item
      await this.prisma.inventoryItem.update({
        where: {
          productId_organizationId: {
            productId: item.productId,
            organizationId,
          },
        },
        data: {
          quantity: {
            decrement: item.quantity.toNumber(),
          },
        },
      });
    }

    return updatedSale;
  }

  async cancel(id: string, organizationId: string): Promise<Sale> {
    return this.prisma.sale.update({
      where: { id, organizationId },
      data: { status: 'CANCELADA' },
    });
  }

  async delete(id: string, organizationId: string): Promise<Sale> {
    // Solo se pueden eliminar ventas pendientes
    const sale = await this.prisma.sale.findUnique({
      where: { id, organizationId },
    });

    if (sale?.status !== 'CONFIRMADA') {
      throw new Error('Solo se pueden eliminar ventas confirmadas');
    }

    return this.prisma.sale.delete({
      where: { id, organizationId },
    });
  }
}
