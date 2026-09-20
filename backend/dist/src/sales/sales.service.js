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
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const inventory_service_1 = require("../inventory/inventory.service");
const stock_movements_service_1 = require("../stock-movements/stock-movements.service");
const create_sale_dto_1 = require("./dto/create-sale.dto");
const client_1 = require("@prisma/client");
let SalesService = class SalesService {
    constructor(prisma, inventoryService, stockMovementService) {
        this.prisma = prisma;
        this.inventoryService = inventoryService;
        this.stockMovementService = stockMovementService;
    }
    async create(organizationId, userId, dto) {
        return this.prisma.$transaction(async (tx) => {
            const saleNumber = await this.generateSaleNumberInTransaction(tx, organizationId);
            let subtotal = 0;
            let taxAmount = 0;
            let total = 0;
            const items = await Promise.all(dto.items.map(async (item) => {
                const lineSubtotal = item.quantity * item.unitPrice;
                const lineDiscount = item.discount || 0;
                const lineTaxRate = item.taxRate ?? 0.18;
                const lineTaxAmount = (lineSubtotal - lineDiscount) * lineTaxRate;
                const lineTotal = lineSubtotal - lineDiscount + lineTaxAmount;
                subtotal += lineSubtotal;
                taxAmount += lineTaxAmount;
                total += lineTotal;
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
            }));
            const globalDiscount = dto.discount || 0;
            total -= globalDiscount;
            return tx.sale.create({
                data: {
                    organizationId,
                    saleNumber,
                    customerId: dto.customerId,
                    type: dto.type || create_sale_dto_1.SaleType.VENTA_MOSTRADOR,
                    status: dto.status || create_sale_dto_1.SaleStatus.CONFIRMADA,
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
        });
    }
    async findAll(organizationId, status, customerId) {
        const where = { organizationId };
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
    async findOne(organizationId, id) {
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
            throw new common_1.NotFoundException(`Sale with ID ${id} not found`);
        }
        return sale;
    }
    async update(organizationId, id, dto) {
        await this.findOne(organizationId, id);
        const existing = await this.prisma.sale.findUnique({
            where: { id },
            select: { status: true },
        });
        if (existing &&
            [
                client_1.SaleStatus.COMPLETADA,
                client_1.SaleStatus.CANCELADA,
                client_1.SaleStatus.DEVUELTA_TOTAL,
            ].includes(existing.status)) {
            throw new common_1.BadRequestException('Cannot update a completed, cancelled or fully returned sale');
        }
        return this.prisma.sale.update({
            where: { id },
            data: dto,
        });
    }
    async complete(organizationId, userId, id) {
        const sale = await this.findOne(organizationId, id);
        if (sale.status !== create_sale_dto_1.SaleStatus.CONFIRMADA) {
            throw new common_1.BadRequestException('Sale must be confirmed before completing');
        }
        return this.prisma.$transaction(async (tx) => {
            for (const saleItem of sale.items) {
                const quantity = saleItem.quantity;
                const result = await this.stockMovementService.adjustStockInTransaction(tx, saleItem.productId, organizationId, -quantity, client_1.MovementReason.VENTA, userId, {
                    batchId: saleItem.batchId || null,
                    referenceType: 'SALE',
                    referenceId: id,
                    notes: `Venta ${sale.saleNumber}`,
                });
                if (result.batch && result.batch.id !== saleItem.batchId) {
                    await tx.saleItem.update({
                        where: { id: saleItem.id },
                        data: { batchId: result.batch.id },
                    });
                }
            }
            return tx.sale.update({
                where: { id },
                data: {
                    status: create_sale_dto_1.SaleStatus.COMPLETADA,
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
    async processPayment(organizationId, userId, saleId, dto) {
        const sale = await this.findOne(organizationId, saleId);
        if (Number(sale.amountPending) <= 0) {
            throw new common_1.BadRequestException('Sale is already fully paid');
        }
        const paymentAmount = Math.min(dto.amount, Number(sale.amountPending));
        const payment = await this.prisma.payment.create({
            data: {
                organizationId,
                referenceType: 'SALE',
                referenceId: saleId,
                amount: paymentAmount,
                method: dto.method,
                status: client_1.PaymentStatus.PAGADO,
                transactionId: dto.transactionId,
                bankName: dto.bankName,
                cardLastFour: dto.cardLastFour,
                notes: dto.notes,
                processedBy: userId,
            },
        });
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
    async cancel(organizationId, id) {
        const sale = await this.findOne(organizationId, id);
        if ([
            client_1.SaleStatus.CANCELADA,
            client_1.SaleStatus.DEVUELTA_TOTAL,
        ].includes(sale.status)) {
            throw new common_1.BadRequestException('Sale is already cancelled or fully returned');
        }
        return this.prisma.sale.update({
            where: { id },
            data: { status: client_1.SaleStatus.CANCELADA },
        });
    }
    async remove(organizationId, id) {
        const sale = await this.findOne(organizationId, id);
        if (![client_1.SaleStatus.BORRADOR].includes(sale.status)) {
            throw new common_1.BadRequestException('Can only delete draft sales');
        }
        return this.prisma.sale.delete({
            where: { id },
        });
    }
    async generateSaleNumberInTransaction(tx, organizationId) {
        const prefix = 'V';
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
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
    async generateSaleNumber(organizationId) {
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
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        inventory_service_1.InventoryService,
        stock_movements_service_1.StockMovementService])
], SalesService);
//# sourceMappingURL=sales.service.js.map