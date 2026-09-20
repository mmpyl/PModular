"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashRegistersRepository = void 0;
const prisma_service_1 = require("../../prisma.service");
const common_1 = require("@nestjs/common");
let CashRegistersRepository = class CashRegistersRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(organizationId) {
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
    async findOne(id, organizationId) {
        return this.prisma.cashRegister.findUnique({
            where: { id, organizationId },
            include: {
                movements: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
    }
    async findByStatus(organizationId, status) {
        return this.prisma.cashRegister.findMany({
            where: { organizationId, status },
            include: {
                movements: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
    }
    async create(data, organizationId) {
        return this.prisma.cashRegister.create({
            data: {
                ...data,
                organizationId,
                status: 'CERRADA',
            },
        });
    }
    async update(id, data, organizationId) {
        return this.prisma.cashRegister.update({
            where: { id, organizationId },
            data,
        });
    }
    async open(id, data, userId, organizationId) {
        const cashRegister = await this.prisma.cashRegister.findUnique({
            where: { id, organizationId },
        });
        if (!cashRegister) {
            throw new common_1.NotFoundException('Caja no encontrada');
        }
        if (cashRegister.status === 'ABIERTA') {
            throw new common_1.BadRequestException('La caja ya está abierta');
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
    async close(id, data, userId, organizationId) {
        const cashRegister = await this.prisma.cashRegister.findUnique({
            where: { id, organizationId },
            include: { movements: true },
        });
        if (!cashRegister) {
            throw new common_1.NotFoundException('Caja no encontrada');
        }
        if (cashRegister.status !== 'ABIERTA') {
            throw new common_1.BadRequestException('La caja no está abierta');
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
    async addMovement(id, data, userId, organizationId) {
        const cashRegister = await this.prisma.cashRegister.findUnique({
            where: { id, organizationId },
        });
        if (!cashRegister) {
            throw new common_1.NotFoundException('Caja no encontrada');
        }
        if (cashRegister.status !== 'ABIERTA' && cashRegister.status !== 'EN_PAUSA') {
            throw new common_1.BadRequestException('La caja debe estar abierta o en pausa para registrar movimientos');
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
    async getMovements(cashRegisterId, organizationId) {
        return this.prisma.cashRegisterMovement.findMany({
            where: { cashRegisterId, organizationId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async delete(id, organizationId) {
        const cashRegister = await this.prisma.cashRegister.findUnique({
            where: { id, organizationId },
            include: { movements: true },
        });
        if (cashRegister?.status === 'ABIERTA') {
            throw new common_1.BadRequestException('Debe cerrar la caja antes de eliminarla');
        }
        if (cashRegister?.movements && cashRegister.movements.length > 0) {
            throw new common_1.BadRequestException('No se puede eliminar una caja con movimientos registrados');
        }
        return this.prisma.cashRegister.delete({
            where: { id, organizationId },
        });
    }
};
exports.CashRegistersRepository = CashRegistersRepository;
exports.CashRegistersRepository = CashRegistersRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CashRegistersRepository);
//# sourceMappingURL=cash-registers.repository.js.map