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
exports.BusinessEntitiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let BusinessEntitiesService = class BusinessEntitiesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(organizationId, dto) {
        return this.prisma.businessEntity.create({
            data: {
                ...dto,
                organizationId,
            },
        });
    }
    async findAll(organizationId, entityType, search) {
        const where = { organizationId };
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
    async findOne(organizationId, id) {
        const entity = await this.prisma.businessEntity.findFirst({
            where: { id, organizationId },
        });
        if (!entity) {
            throw new common_1.NotFoundException(`Business entity with ID ${id} not found`);
        }
        return entity;
    }
    async findOneWithHistory(organizationId, id) {
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
                    take: 20,
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
                    take: 20,
                },
            },
        });
        if (!entity) {
            throw new common_1.NotFoundException(`Business entity with ID ${id} not found`);
        }
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
    async update(organizationId, id, dto) {
        await this.findOne(organizationId, id);
        return this.prisma.businessEntity.update({
            where: { id },
            data: dto,
        });
    }
    async remove(organizationId, id) {
        await this.findOne(organizationId, id);
        return this.prisma.businessEntity.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async hardDelete(organizationId, id) {
        await this.findOne(organizationId, id);
        return this.prisma.businessEntity.delete({
            where: { id },
        });
    }
    async recalculateBalance(organizationId, id) {
        const entity = await this.findOne(organizationId, id);
        const purchases = await this.prisma.purchaseOrder.findMany({
            where: {
                organizationId,
                supplierId: id,
                status: 'COMPLETADA',
            },
            select: { totalAmount: true },
        });
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
        const newBalance = totalSales - totalPurchases;
        return this.prisma.businessEntity.update({
            where: { id },
            data: { currentBalance: newBalance },
        });
    }
    async checkCreditLimit(organizationId, id) {
        const entity = await this.findOne(organizationId, id);
        if (!entity.creditLimit) {
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
};
exports.BusinessEntitiesService = BusinessEntitiesService;
exports.BusinessEntitiesService = BusinessEntitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BusinessEntitiesService);
//# sourceMappingURL=business-entities.service.js.map