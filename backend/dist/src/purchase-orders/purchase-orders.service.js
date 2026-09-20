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
exports.PurchaseOrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const inventory_service_1 = require("../inventory/inventory.service");
const stock_movements_service_1 = require("../stock-movements/stock-movements.service");
const client_1 = require("@prisma/client");
let PurchaseOrdersService = class PurchaseOrdersService {
    constructor(prisma, inventoryService, stockMovementService) {
        this.prisma = prisma;
        this.inventoryService = inventoryService;
        this.stockMovementService = stockMovementService;
    }
    async create(organizationId, userId, dto) {
        return this.prisma.$transaction(async (tx) => {
            const orderNumber = await this.generateOrderNumberInTransaction(tx, organizationId);
            let subtotal = 0;
            let taxAmount = 0;
            let total = 0;
            const items = dto.items.map((item) => {
                const lineSubtotal = item.quantityOrdered * item.unitCost;
                const lineDiscount = item.discount || 0;
                const lineTaxRate = item.taxRate ?? 0.18;
                const lineTaxAmount = (lineSubtotal - lineDiscount) * lineTaxRate;
                const lineTotal = lineSubtotal - lineDiscount + lineTaxAmount;
                subtotal += lineSubtotal;
                taxAmount += lineTaxAmount;
                total += lineTotal - lineDiscount;
                return {
                    productId: item.productId,
                    quantityOrdered: item.quantityOrdered,
                    quantityReceived: 0,
                    unitCost: item.unitCost,
                    discount: item.discount || 0,
                    taxRate: item.taxRate ?? 0.18,
                    subtotal: lineSubtotal,
                    taxAmount: lineTaxAmount,
                    total: lineTotal,
                    batchNumber: item.batchNumber,
                    expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
                    notes: item.notes,
                };
            });
            const globalDiscount = dto.discount || 0;
            total -= globalDiscount;
            return tx.purchaseOrder.create({
                data: {
                    organizationId,
                    orderNumber,
                    supplierId: dto.supplierId,
                    status: dto.status || client_1.PurchaseOrderStatus.BORRADOR,
                    expectedDeliveryDate: dto.expectedDeliveryDate
                        ? new Date(dto.expectedDeliveryDate)
                        : null,
                    paymentTerm: dto.paymentTerm || 'CONTADO',
                    paymentDueDate: dto.paymentDueDate ? new Date(dto.paymentDueDate) : null,
                    subtotal,
                    taxRate: dto.taxRate ?? 0.18,
                    taxAmount,
                    discount: globalDiscount,
                    total,
                    currency: dto.currency || 'PEN',
                    notes: dto.notes,
                    internalNotes: dto.internalNotes,
                    externalReference: dto.externalReference,
                    createdBy: userId,
                    items: {
                        create: items,
                    },
                },
                include: {
                    supplier: true,
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });
        });
    }
    async findAll(organizationId, status, supplierId) {
        const where = { organizationId };
        if (status) {
            where.status = status;
        }
        if (supplierId) {
            where.supplierId = supplierId;
        }
        return this.prisma.purchaseOrder.findMany({
            where,
            include: {
                supplier: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: { orderDate: 'desc' },
        });
    }
    async findOne(organizationId, id) {
        const order = await this.prisma.purchaseOrder.findFirst({
            where: { id, organizationId },
            include: {
                supplier: true,
                items: {
                    include: {
                        product: true,
                    },
                },
                stockMovements: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException(`Purchase order with ID ${id} not found`);
        }
        return order;
    }
    async update(organizationId, id, dto) {
        await this.findOne(organizationId, id);
        const existing = await this.prisma.purchaseOrder.findUnique({
            where: { id },
            select: { status: true },
        });
        if (existing &&
            (existing.status === client_1.PurchaseOrderStatus.COMPLETADA ||
                existing.status === client_1.PurchaseOrderStatus.CANCELADA)) {
            throw new common_1.BadRequestException('Cannot update a completed or cancelled purchase order');
        }
        return this.prisma.purchaseOrder.update({
            where: { id },
            data: dto,
        });
    }
    async receive(organizationId, userId, orderId, dto) {
        const order = await this.findOne(organizationId, orderId);
        if (order.status === client_1.PurchaseOrderStatus.CANCELADA) {
            throw new common_1.BadRequestException('Cannot receive a cancelled order');
        }
        return this.prisma.$transaction(async (tx) => {
            for (const receiveItem of dto.items) {
                const orderItem = order.items.find((item) => item.id === receiveItem.itemId);
                if (!orderItem) {
                    throw new common_1.NotFoundException(`Item ${receiveItem.itemId} not found in order`);
                }
                const quantityReceived = receiveItem.quantityReceived;
                await tx.purchaseOrderItem.update({
                    where: { id: receiveItem.itemId },
                    data: {
                        quantityReceived: {
                            increment: quantityReceived,
                        },
                        batchNumber: receiveItem.batchNumber || orderItem.batchNumber,
                        expirationDate: receiveItem.expirationDate
                            ? new Date(receiveItem.expirationDate)
                            : orderItem.expirationDate ?? undefined,
                    },
                });
                await this.stockMovementService.adjustStockInTransaction(tx, orderItem.productId, organizationId, quantityReceived, client_1.MovementReason.COMPRA, userId, {
                    batchNumber: receiveItem.batchNumber || undefined,
                    expirationDate: receiveItem.expirationDate
                        ? new Date(receiveItem.expirationDate)
                        : orderItem.expirationDate ?? undefined,
                    unitCost: Number(orderItem.unitCost),
                    referenceType: 'PURCHASE_ORDER',
                    referenceId: orderId,
                    notes: `Recepción de orden ${order.orderNumber}`,
                });
            }
            const updatedOrder = await tx.purchaseOrder.findUnique({
                where: { id: orderId },
                include: { items: true },
            });
            if (!updatedOrder) {
                throw new common_1.NotFoundException(`Purchase order with ID ${orderId} not found`);
            }
            const allItemsReceived = updatedOrder.items.every((item) => Number(item.quantityReceived) >= Number(item.quantityOrdered));
            const someItemsReceived = updatedOrder.items.some((item) => Number(item.quantityReceived) > 0);
            let newStatus = order.status;
            if (allItemsReceived) {
                newStatus = client_1.PurchaseOrderStatus.COMPLETADA;
            }
            else if (someItemsReceived) {
                newStatus = client_1.PurchaseOrderStatus.PARCIALMENTE_RECIBIDA;
            }
            return tx.purchaseOrder.update({
                where: { id: orderId },
                data: {
                    status: newStatus,
                    receivedDate: allItemsReceived ? new Date() : undefined,
                },
                include: {
                    supplier: true,
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
            });
        });
    }
    async cancel(organizationId, id) {
        const order = await this.findOne(organizationId, id);
        if (order.status === client_1.PurchaseOrderStatus.COMPLETADA ||
            order.status === client_1.PurchaseOrderStatus.CANCELADA) {
            throw new common_1.BadRequestException('Cannot cancel a completed or already cancelled order');
        }
        return this.prisma.purchaseOrder.update({
            where: { id },
            data: { status: client_1.PurchaseOrderStatus.CANCELADA },
        });
    }
    async remove(organizationId, id) {
        const order = await this.findOne(organizationId, id);
        if (order.status !== client_1.PurchaseOrderStatus.BORRADOR) {
            throw new common_1.BadRequestException('Can only delete draft purchase orders');
        }
        return this.prisma.purchaseOrder.delete({
            where: { id },
        });
    }
    async generateOrderNumberInTransaction(tx, organizationId) {
        const prefix = 'PO';
        const year = new Date().getFullYear();
        const lastOrder = await tx.purchaseOrder.findFirst({
            where: {
                organizationId,
                orderNumber: {
                    startsWith: `${prefix}-${year}-`,
                },
            },
            orderBy: { orderNumber: 'desc' },
        });
        let sequence = 1;
        if (lastOrder) {
            const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2]);
            sequence = lastNumber + 1;
        }
        return `${prefix}-${year}-${String(sequence).padStart(4, '0')}`;
    }
    async generateOrderNumber(organizationId) {
        const prefix = 'PO';
        const year = new Date().getFullYear();
        const lastOrder = await this.prisma.purchaseOrder.findFirst({
            where: {
                organizationId,
                orderNumber: {
                    startsWith: `${prefix}-${year}-`,
                },
            },
            orderBy: { orderNumber: 'desc' },
        });
        let sequence = 1;
        if (lastOrder) {
            const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2]);
            sequence = lastNumber + 1;
        }
        return `${prefix}-${year}-${String(sequence).padStart(4, '0')}`;
    }
};
exports.PurchaseOrdersService = PurchaseOrdersService;
exports.PurchaseOrdersService = PurchaseOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        inventory_service_1.InventoryService,
        stock_movements_service_1.StockMovementService])
], PurchaseOrdersService);
//# sourceMappingURL=purchase-orders.service.js.map