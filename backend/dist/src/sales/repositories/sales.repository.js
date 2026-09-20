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
exports.SalesRepository = void 0;
const prisma_service_1 = require("../../prisma.service");
const common_1 = require("@nestjs/common");
let SalesRepository = class SalesRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(organizationId) {
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
    async findOne(id, organizationId) {
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
    async create(data, userId, organizationId) {
        const { items, ...saleData } = data;
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
                saleNumber: `SALE-${Date.now()}`,
                organizationId,
                soldBy: userId,
                status: 'CONFIRMADA',
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
    async update(id, data, organizationId) {
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
    async complete(id, payments, userId, organizationId) {
        const sale = await this.prisma.sale.findUnique({
            where: { id, organizationId },
            include: { items: true },
        });
        if (!sale) {
            throw new common_1.NotFoundException('Venta no encontrada');
        }
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        if (totalPaid < sale.total.toNumber()) {
            throw new common_1.BadRequestException('El monto pagado no cubre el total de la venta');
        }
        const updatedSale = await this.prisma.sale.update({
            where: { id, organizationId },
            data: {
                status: 'COMPLETADA',
                payments: {
                    create: payments.map((payment) => ({
                        method: payment.method,
                        amount: payment.amount,
                        reference: payment.reference,
                        notes: payment.notes,
                        organizationId,
                        referenceType: 'SALE',
                        referenceId: id,
                        processedBy: userId,
                        status: 'COMPLETADO',
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
    async cancel(id, organizationId) {
        return this.prisma.sale.update({
            where: { id, organizationId },
            data: { status: 'CANCELADA' },
        });
    }
    async delete(id, organizationId) {
        const sale = await this.prisma.sale.findUnique({
            where: { id, organizationId },
        });
        if (sale?.status !== 'CONFIRMADA') {
            throw new common_1.BadRequestException('Solo se pueden eliminar ventas confirmadas');
        }
        return this.prisma.sale.delete({
            where: { id, organizationId },
        });
    }
};
exports.SalesRepository = SalesRepository;
exports.SalesRepository = SalesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SalesRepository);
//# sourceMappingURL=sales.repository.js.map