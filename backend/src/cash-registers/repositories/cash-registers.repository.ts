import { PrismaService } from '../../prisma.service';
import { Injectable } from '@nestjs/common';
import { CashRegister, CashRegisterMovement } from '@prisma/client';
import { CreateCashRegisterDto, UpdateCashRegisterDto, OpenCashRegisterDto, CloseCashRegisterDto, CreateCashRegisterMovementDto } from '../dto/create-cash-register.dto';

@Injectable()
export class CashRegistersRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string): Promise<CashRegister[]> {
    return this.prisma.cashRegister.findMany({
      where: { organizationId },
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<CashRegister | null> {
    return this.prisma.cashRegister.findUnique({
      where: { id, organizationId },
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByStatus(organizationId: string, status: string): Promise<CashRegister[]> {
    return this.prisma.cashRegister.findMany({
      where: { organizationId, status },
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async create(data: CreateCashRegisterDto, organizationId: string): Promise<CashRegister> {
    return this.prisma.cashRegister.create({
      data: {
        ...data,
        organizationId,
        status: 'CERRADA',
      },
    });
  }

  async update(id: string, data: UpdateCashRegisterDto, organizationId: string): Promise<CashRegister> {
    return this.prisma.cashRegister.update({
      where: { id, organizationId },
      data,
    });
  }

  async open(id: string, data: OpenCashRegisterDto, userId: string, organizationId: string): Promise<CashRegister> {
    const cashRegister = await this.prisma.cashRegister.findUnique({
      where: { id, organizationId },
    });

    if (!cashRegister) {
      throw new Error('Caja no encontrada');
    }

    if (cashRegister.status === 'ABIERTA') {
      throw new Error('La caja ya está abierta');
    }

    const openingBalance = data.openingBalance || 0;

    // Actualizar caja
    const updated = await this.prisma.cashRegister.update({
      where: { id, organizationId },
      data: {
        status: 'ABIERTA',
        currentUserId: userId,
        openedAt: new Date(),
        openingBalance,
        expectedClosingBalance: openingBalance,
      },
    });

    // Crear movimiento de apertura
    await this.prisma.cashRegisterMovement.create({
      data: {
        cashRegisterId: id,
        organizationId,
        type: 'APERTURA',
        amount: openingBalance,
        isPositive: true,
        paymentMethod: 'EFECTIVO',
        description: 'Apertura de caja',
        performedBy: userId,
      },
    });

    return updated;
  }

  async close(id: string, data: CloseCashRegisterDto, userId: string, organizationId: string): Promise<CashRegister> {
    const cashRegister = await this.prisma.cashRegister.findUnique({
      where: { id, organizationId },
      include: { movements: true },
    });

    if (!cashRegister) {
      throw new Error('Caja no encontrada');
    }

    if (cashRegister.status !== 'ABIERTA') {
      throw new Error('La caja no está abierta');
    }

    const actualClosingBalance = data.actualClosingBalance;
    const difference = actualClosingBalance - cashRegister.expectedClosingBalance.toNumber();

    // Actualizar caja
    const updated = await this.prisma.cashRegister.update({
      where: { id, organizationId },
      data: {
        status: 'CERRADA',
        closedAt: new Date(),
        actualClosingBalance,
        difference,
        closingNotes: data.closingNotes,
        currentUserId: null,
      },
    });

    // Crear movimiento de cierre
    await this.prisma.cashRegisterMovement.create({
      data: {
        cashRegisterId: id,
        organizationId,
        type: 'CIERRE',
        amount: actualClosingBalance,
        isPositive: true,
        description: `Cierre de caja. Diferencia: ${difference}`,
        performedBy: userId,
        notes: data.closingNotes,
      },
    });

    // Si hay diferencia, crear ajuste
    if (difference !== 0) {
      await this.prisma.cashRegisterMovement.create({
        data: {
          cashRegisterId: id,
          organizationId,
          type: 'AJUSTE',
          amount: Math.abs(difference),
          isPositive: difference > 0,
          description: difference > 0 ? 'Sobrante en caja' : 'Faltante en caja',
          performedBy: userId,
        },
      });
    }

    return updated;
  }

  async addMovement(
    id: string,
    data: CreateCashRegisterMovementDto,
    userId: string,
    organizationId: string,
  ): Promise<CashRegisterMovement> {
    const cashRegister = await this.prisma.cashRegister.findUnique({
      where: { id, organizationId },
    });

    if (!cashRegister) {
      throw new Error('Caja no encontrada');
    }

    if (cashRegister.status !== 'ABIERTA' && cashRegister.status !== 'EN_PAUSA') {
      throw new Error('La caja debe estar abierta o en pausa para registrar movimientos');
    }

    const movement = await this.prisma.cashRegisterMovement.create({
      data: {
        ...data,
        cashRegisterId: id,
        organizationId,
        performedBy: userId,
      },
    });

    // Actualizar expectedClosingBalance
    const balanceChange = data.isPositive ? data.amount : -data.amount;
    await this.prisma.cashRegister.update({
      where: { id, organizationId },
      data: {
        expectedClosingBalance: {
          increment: balanceChange,
        },
      },
    });

    return movement;
  }

  async getMovements(cashRegisterId: string, organizationId: string): Promise<CashRegisterMovement[]> {
    return this.prisma.cashRegisterMovement.findMany({
      where: { cashRegisterId, organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string, organizationId: string): Promise<CashRegister> {
    const cashRegister = await this.prisma.cashRegister.findUnique({
      where: { id, organizationId },
      include: { movements: true },
    });

    if (cashRegister?.status === 'ABIERTA') {
      throw new Error('Debe cerrar la caja antes de eliminarla');
    }

    if (cashRegister?.movements && cashRegister.movements.length > 0) {
      throw new Error('No se puede eliminar una caja con movimientos registrados');
    }

    return this.prisma.cashRegister.delete({
      where: { id, organizationId },
    });
  }
}
