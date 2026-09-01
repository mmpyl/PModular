import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateCashRegisterDto, UpdateCashRegisterDto, OpenCashRegisterDto, CloseCashRegisterDto, CreateCashRegisterMovementDto } from '../dto/create-cash-register.dto';

@Injectable()
export class CashRegistersService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
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

  async findOne(id: string, organizationId: string) {
    const cashRegister = await this.prisma.cashRegister.findUnique({
      where: { id, organizationId },
      include: {
        movements: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!cashRegister) {
      throw new NotFoundException(`Caja con ID ${id} no encontrada`);
    }
    return cashRegister;
  }

  async create(data: CreateCashRegisterDto, organizationId: string) {
    return this.prisma.cashRegister.create({
      data: {
        ...data,
        organizationId,
        status: 'CERRADA',
      },
    });
  }

  async update(id: string, data: UpdateCashRegisterDto, organizationId: string) {
    const cashRegister = await this.findOne(id, organizationId);
    return this.prisma.cashRegister.update({
      where: { id, organizationId },
      data,
    });
  }

  async open(id: string, data: OpenCashRegisterDto, userId: string, organizationId: string) {
    const cashRegister = await this.findOne(id, organizationId);

    if (cashRegister.status === 'ABIERTA') {
      throw new BadRequestException('La caja ya está abierta');
    }

    const openingBalance = data.openingBalance || 0;

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

  async close(id: string, data: CloseCashRegisterDto, userId: string, organizationId: string) {
    const cashRegister = await this.findOne(id, organizationId);

    if (cashRegister.status !== 'ABIERTA') {
      throw new BadRequestException('La caja no está abierta');
    }

    const actualClosingBalance = data.actualClosingBalance;
    const difference = actualClosingBalance - cashRegister.expectedClosingBalance.toNumber();

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
  ) {
    const cashRegister = await this.findOne(id, organizationId);

    if (cashRegister.status !== 'ABIERTA' && cashRegister.status !== 'EN_PAUSA') {
      throw new BadRequestException('La caja debe estar abierta o en pausa para registrar movimientos');
    }

    const movement = await this.prisma.cashRegisterMovement.create({
      data: {
        ...data,
        cashRegisterId: id,
        organizationId,
        performedBy: userId,
      },
    });

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

  async getMovements(id: string, organizationId: string) {
    return this.prisma.cashRegisterMovement.findMany({
      where: { cashRegisterId: id, organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string, organizationId: string) {
    const cashRegister = await this.prisma.cashRegister.findUnique({
      where: { id, organizationId },
      include: { movements: true },
    });

    if (cashRegister?.status === 'ABIERTA') {
      throw new BadRequestException('Debe cerrar la caja antes de eliminarla');
    }

    if (cashRegister?.movements.length > 0) {
      throw new BadRequestException('No se puede eliminar una caja con movimientos registrados');
    }

    return this.prisma.cashRegister.delete({
      where: { id, organizationId },
    });
  }
}
