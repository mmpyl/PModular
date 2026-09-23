import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateAccountEntryDto, UpdateAccountEntryNotesDto } from './dto/account-entry.dto';

export interface AccountStatementFilters {
  from?: string;
  to?: string;
  includeVoided?: boolean;
}

export interface OverdueAccountItem {
  customerId: string;
  customerName: string;
  taxId: string | null;
  mobile: string | null;
  balance: number;
  oldestDueDate: Date | null;
  daysOverdue: number;
  pendingSalesCount: number;
}

/**
 * Fase B1 — Cuenta corriente / fiado formal.
 *
 * Modelo contable: cada asiento es CREDITO (aumenta la deuda del cliente,
 * p.ej. una venta fiada) o DEBITO (reduce la deuda, p.ej. un abono).
 * `BusinessEntity.currentBalance` se mantiene sincronizado como saldo acumulado
 * (positivo = debe el cliente, negativo = tiene a favor).
 */
@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  /** Genera un número correlativo humano CC-000001 por organización. */
  private async generateEntryNumber(
    tx: Prisma.TransactionClient,
    organizationId: string,
  ): Promise<string> {
    const last = await tx.customerAccountEntry.findFirst({
      where: { organizationId },
      orderBy: { entryNumber: 'desc' },
      select: { entryNumber: true },
    });

    let next = 1;
    if (last) {
      const match = last.entryNumber.match(/^CC-(\d+)$/);
      if (match) next = parseInt(match[1], 10) + 1;
    }

    return `CC-${String(next).padStart(6, '0')}`;
  }

  /** Valida que el cliente exista en la organización y sea cliente. */
  private async assertCustomer(organizationId: string, customerId: string) {
    const customer = await this.prisma.businessEntity.findFirst({
      where: { id: customerId, organizationId },
    });
    if (!customer) {
      throw new NotFoundException(`Cliente con ID ${customerId} no encontrado`);
    }
    if (customer.entityType === 'PROVEEDOR') {
      throw new BadRequestException(
        'La cuenta corriente solo aplica a clientes (o entidades tipo AMBOS)',
      );
    }
    return customer;
  }

  /**
   * Registra un asiento manual (ajuste, saldo inicial, abono sin pago asociado).
   */
  async createManualEntry(
    organizationId: string,
    userId: string,
    dto: CreateAccountEntryDto,
  ) {
    const customer = await this.assertCustomer(organizationId, dto.customerId);

    if (dto.type === 'DEBITO' && Number(customer.currentBalance) < dto.amount - 0.005) {
      throw new BadRequestException(
        `El abono (${dto.amount}) supera el saldo pendiente del cliente (${Number(customer.currentBalance)}). Use un ajuste para corregir errores.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const entryNumber = await this.generateEntryNumber(tx, organizationId);

      const entry = await tx.customerAccountEntry.create({
        data: {
          organizationId,
          entryNumber,
          customerId: dto.customerId,
          type: dto.type,
          amount: dto.amount,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          description:
            dto.description ?? (dto.type === 'CREDITO' ? 'Ajuste - cargo en cuenta' : 'Ajuste - abono en cuenta'),
          notes: dto.notes,
          createdBy: userId,
        },
      });

      const delta = dto.type === 'CREDITO' ? dto.amount : -dto.amount;
      const updatedCustomer = await tx.businessEntity.update({
        where: { id: dto.customerId },
        data: {
          currentBalance: { increment: delta },
        },
      });

      return { entry, customer: updatedCustomer };
    });
  }

  /**
   * Asiento automático generado por el flujo de ventas (venta fiada / abono).
   * No expuesto vía HTTP: se invoca desde SalesService dentro de su transacción.
   */
  async createSaleLinkedEntry(
    tx: Prisma.TransactionClient,
    params: {
      organizationId: string;
      customerId: string;
      type: 'CREDITO' | 'DEBITO';
      amount: number;
      referenceType: 'SALE' | 'PAYMENT';
      referenceId: string;
      dueDate?: Date | null;
      description: string;
      createdBy: string;
    },
  ) {
    const entryNumber = await this.generateEntryNumber(tx, params.organizationId);

    const entry = await tx.customerAccountEntry.create({
      data: {
        organizationId: params.organizationId,
        entryNumber,
        customerId: params.customerId,
        type: params.type,
        amount: params.amount,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        dueDate: params.dueDate ?? null,
        description: params.description,
        createdBy: params.createdBy,
      },
    });

    const delta = params.type === 'CREDITO' ? params.amount : -params.amount;
    await tx.businessEntity.update({
      where: { id: params.customerId },
      data: { currentBalance: { increment: delta } },
    });

    return entry;
  }

  /** Anula un asiento (no lo borra): revierte su efecto sobre el saldo. */
  async voidEntry(organizationId: string, id: string) {
    const entry = await this.prisma.customerAccountEntry.findFirst({
      where: { id, organizationId },
    });

    if (!entry) {
      throw new NotFoundException(`Asiento de cuenta con ID ${id} no encontrado`);
    }
    if (entry.status === 'ANULADO') {
      throw new BadRequestException('El asiento ya está anulado');
    }

    const delta = entry.type === 'CREDITO'
      ? -Number(entry.amount)
      : Number(entry.amount);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.customerAccountEntry.update({
        where: { id },
        data: { status: 'ANULADO' },
      });
      await tx.businessEntity.update({
        where: { id: entry.customerId },
        data: { currentBalance: { increment: delta } },
      });
      return updated;
    });
  }

  async updateEntryNotes(
    organizationId: string,
    id: string,
    dto: UpdateAccountEntryNotesDto,
  ) {
    const entry = await this.prisma.customerAccountEntry.findFirst({
      where: { id, organizationId },
    });
    if (!entry) {
      throw new NotFoundException(`Asiento de cuenta con ID ${id} no encontrado`);
    }
    return this.prisma.customerAccountEntry.update({
      where: { id },
      data: { description: dto.description, notes: dto.notes },
    });
  }

  /**
   * Extracto de cuenta corriente con saldo corrido (statements estilo bodega).
   */
  async getStatement(
    organizationId: string,
    customerId: string,
    filters: AccountStatementFilters = {},
  ) {
    const customer = await this.assertCustomer(organizationId, customerId);

    const where: Prisma.CustomerAccountEntryWhereInput = {
      organizationId,
      customerId,
    };
    if (!filters.includeVoided) {
      where.status = 'VIGENTE';
    }
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) {
        const to = new Date(filters.to);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    const entries = await this.prisma.customerAccountEntry.findMany({
      where,
      orderBy: [{ createdAt: 'asc' }, { entryNumber: 'asc' }],
    });

    // Saldo anterior al rango filtrado (calculado sobre los asientos vigentes)
    const allVigentes = await this.prisma.customerAccountEntry.findMany({
      where: { organizationId, customerId, status: 'VIGENTE' },
      select: { amount: true, type: true, createdAt: true },
      orderBy: [{ createdAt: 'asc' }],
    });

    const fromDate = filters.from ? new Date(filters.from) : null;
    let openingBalance = 0;
    for (const e of allVigentes) {
      const signed = e.type === 'CREDITO' ? Number(e.amount) : -Number(e.amount);
      if (!fromDate || e.createdAt < fromDate) {
        openingBalance += signed;
      }
    }

    let running = openingBalance;
    const statementEntries = entries.map((entry) => {
      const signed = entry.type === 'CREDITO' ? Number(entry.amount) : -Number(entry.amount);
      running += signed;
      return {
        ...entry,
        amount: Number(entry.amount),
        signedAmount: signed,
        runningBalance: Math.round(running * 100) / 100,
        isOverdue: !!entry.dueDate && entry.dueDate < new Date() && Number(entry.amount) > 0 && entry.type === 'CREDITO',
      };
    });

    const totalCharges = allVigentes
      .filter((e) => e.type === 'CREDITO')
      .reduce((s, e) => s + Number(e.amount), 0);
    const totalPayments = allVigentes
      .filter((e) => e.type === 'DEBITO')
      .reduce((s, e) => s + Number(e.amount), 0);

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        taxId: customer.taxId,
        phone: customer.phone,
        mobile: customer.mobile,
        creditLimit: customer.creditLimit != null ? Number(customer.creditLimit) : null,
        creditDays: customer.creditDays,
        currentBalance: Number(customer.currentBalance),
      },
      openingBalance: Math.round(openingBalance * 100) / 100,
      closingBalance: Math.round(running * 100) / 100,
      totalCharges,
      totalPayments,
      entries: statementEntries,
    };
  }

  /**
   * Deudores con cuentas vencidas (alertas de mora), ordenados por gravedad.
   */
  async getOverdueAccounts(organizationId: string): Promise<OverdueAccountItem[]> {
    const now = new Date();

    const overdueEntries = await this.prisma.customerAccountEntry.findMany({
      where: {
        organizationId,
        status: 'VIGENTE',
        type: 'CREDITO',
        dueDate: { lt: now },
      },
      include: {
        customer: {
          select: { id: true, name: true, taxId: true, mobile: true, currentBalance: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Agrupar por cliente
    const byCustomer = new Map<string, OverdueAccountItem>();
    for (const entry of overdueEntries) {
      const c = entry.customer;
      let item = byCustomer.get(c.id);
      if (!item) {
        item = {
          customerId: c.id,
          customerName: c.name,
          taxId: c.taxId,
          mobile: c.mobile,
          balance: Number(c.currentBalance),
          oldestDueDate: entry.dueDate,
          daysOverdue: Math.floor((now.getTime() - entry.dueDate!.getTime()) / 86400000),
          pendingSalesCount: 0,
        };
        byCustomer.set(c.id, item);
      }
      item.pendingSalesCount += 1;
    }

    return [...byCustomer.values()].sort(
      (a, b) => b.daysOverdue - a.daysOverdue || b.balance - a.balance,
    );
  }

  /**
   * Resumen de morosidad/credito para el dashboard y notificaciones.
   */
  async getCreditSummary(organizationId: string) {
    const customersWithBalance = await this.prisma.businessEntity.findMany({
      where: {
        organizationId,
        entityType: { in: ['CLIENTE', 'AMBOS'] },
        isActive: true,
        currentBalance: { gt: 0 },
      },
      select: { id: true, name: true, creditLimit: true, currentBalance: true },
    });

    const totalReceivable = customersWithBalance.reduce(
      (s, c) => s + Number(c.currentBalance),
      0,
    );

    const overLimit = customersWithBalance.filter(
      (c) => c.creditLimit != null && Number(c.currentBalance) > Number(c.creditLimit),
    );

    const overdue = await this.getOverdueAccounts(organizationId);

    return {
      customersInCredit: customersWithBalance.length,
      totalReceivable: Math.round(totalReceivable * 100) / 100,
      overLimitCount: overLimit.length,
      overdueCount: overdue.length,
      totalOverdueAmount: Math.round(
        overdue.reduce((s, o) => s + o.balance, 0) * 100,
      ) / 100,
    };
  }
}
