import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBusinessEntityDto, UpdateBusinessEntityDto, EntityType } from './dto/create-business-entity.dto';

@Injectable()
export class BusinessEntitiesService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateBusinessEntityDto) {
    return this.prisma.businessEntity.create({
      data: {
        ...dto,
        organizationId,
      },
    });
  }

  async findAll(organizationId: string, entityType?: EntityType, search?: string) {
    const where: any = { organizationId };

    if (entityType) {
      where.entityType = entityType;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { taxId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.businessEntity.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const entity = await this.prisma.businessEntity.findFirst({
      where: { id, organizationId },
    });

    if (!entity) {
      throw new NotFoundException(`Business entity with ID ${id} not found`);
    }

    return entity;
  }

  /**
   * Fase 5: Obtiene entidad con historial de transacciones y saldo calculado
   */
  async findOneWithHistory(organizationId: string, id: string) {
    const entity = await this.prisma.businessEntity.findFirst({
      where: { id, organizationId },
      include: {
        purchaseOrders: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20, // Últimas 20 compras
        },
        sales: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20, // Últimas 20 ventas
        },
      },
    });

    if (!entity) {
      throw new NotFoundException(`Business entity with ID ${id} not found`);
    }

    // Calcular saldo pendiente basado en compras y ventas
    const totalPurchases = entity.purchaseOrders
      .filter(po => po.status === 'COMPLETADA')
      .reduce((sum, po) => sum + Number(po.totalAmount), 0);

    const totalSales = entity.sales
      .filter(sale => sale.status === 'COMPLETADA' || sale.status === 'PENDIENTE_PAGO')
      .reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

    return {
      ...entity,
      calculatedBalance: totalSales - totalPurchases,
      totalPurchases,
      totalSales,
    };
  }

  async update(organizationId: string, id: string, dto: UpdateBusinessEntityDto) {
    await this.findOne(organizationId, id);

    return this.prisma.businessEntity.update({
      where: { id },
      data: dto,
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);

    return this.prisma.businessEntity.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.businessEntity.delete({
      where: { id },
    });
  }

  /**
   * Fase 5: Calcula y actualiza el saldo de un cliente/proveedor
   * Basado en sus órdenes de compra y ventas completadas
   */
  async recalculateBalance(organizationId: string, id: string) {
    const entity = await this.findOne(organizationId, id);

    // Obtener todas las compras completadas
    const purchases = await this.prisma.purchaseOrder.findMany({
      where: {
        organizationId,
        supplierId: id,
        status: 'COMPLETADA',
      },
      select: { totalAmount: true },
    });

    // Obtener todas las ventas completadas o pendientes de pago
    const sales = await this.prisma.sale.findMany({
      where: {
        organizationId,
        customerId: id,
        status: { in: ['COMPLETADA', 'PENDIENTE_PAGO'] },
      },
      select: { totalAmount: true },
    });

    const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
    const totalSales = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);

    // Saldo positivo = cliente debe (ventas > compras)
    const newBalance = totalSales - totalPurchases;

    return this.prisma.businessEntity.update({
      where: { id },
      data: { currentBalance: newBalance },
    });
  }

  /**
   * Fase 5: Valida si un cliente excede su límite de crédito
   */
  async checkCreditLimit(organizationId: string, id: string): Promise<{ withinLimit: boolean; currentBalance: number; creditLimit: number | null }> {
    const entity = await this.findOne(organizationId, id);

    if (!entity.creditLimit) {
      // Sin límite de crédito configurado
      return { withinLimit: true, currentBalance: Number(entity.currentBalance), creditLimit: null };
    }

    const creditLimit = Number(entity.creditLimit);
    const currentBalance = Number(entity.currentBalance);

    return {
      withinLimit: currentBalance <= creditLimit,
      currentBalance,
      creditLimit,
    };
  }
}
