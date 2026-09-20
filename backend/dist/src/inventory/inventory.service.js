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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let InventoryService = class InventoryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getInventory(organizationId, productId) {
        const where = { organizationId };
        if (productId) {
            where.productId = productId;
        }
        return this.prisma.inventoryItem.findMany({
            where,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                        category: { select: { name: true } },
                        unit: { select: { name: true, symbol: true } },
                    },
                },
                batches: {
                    where: { status: 'ACTIVO' },
                    orderBy: { expirationDate: 'asc' },
                },
            },
        });
    }
    async getInventoryById(organizationId, id) {
        const item = await this.prisma.inventoryItem.findUnique({
            where: { id, organizationId },
            include: {
                product: true,
                batches: {
                    orderBy: { expirationDate: 'asc' },
                },
            },
        });
        if (!item) {
            throw new common_1.NotFoundException(`Inventory item ${id} not found`);
        }
        return item;
    }
    async ensureInventoryItem(productId, organizationId) {
        const existing = await this.prisma.inventoryItem.findUnique({
            where: {
                productId_organizationId: {
                    productId,
                    organizationId,
                },
            },
        });
        if (existing) {
            return existing;
        }
        return this.prisma.inventoryItem.create({
            data: {
                productId,
                organizationId,
                quantity: 0,
                reserved: 0,
                averageCost: 0,
            },
        });
    }
    async updateInventory(organizationId, id, dto) {
        const existing = await this.prisma.inventoryItem.findUnique({
            where: { id, organizationId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Inventory item ${id} not found`);
        }
        return this.prisma.inventoryItem.update({
            where: { id },
            data: dto,
        });
    }
    async recalculateInventory(productId, organizationId) {
        const batches = await this.prisma.batch.findMany({
            where: {
                productId,
                organizationId,
                status: 'ACTIVO',
            },
        });
        const totalQuantity = batches.reduce((sum, batch) => sum + Number(batch.currentQuantity), 0);
        const totalValue = batches.reduce((sum, batch) => sum + Number(batch.currentQuantity) * Number(batch.unitCost), 0);
        const averageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;
        return this.prisma.inventoryItem.update({
            where: {
                productId_organizationId: {
                    productId,
                    organizationId,
                },
            },
            data: {
                quantity: totalQuantity,
                averageCost,
            },
        });
    }
    async getLowStockItems(organizationId, threshold = 10) {
        return this.prisma.inventoryItem.findMany({
            where: {
                organizationId,
                quantity: {
                    lte: threshold,
                },
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        sku: true,
                    },
                },
            },
        });
    }
    async getExpiringBatches(organizationId, daysThreshold = 30) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysThreshold);
        return this.prisma.batch.findMany({
            where: {
                organizationId,
                status: 'ACTIVO',
                expirationDate: {
                    lte: futureDate,
                },
            },
            include: {
                product: {
                    select: {
                        name: true,
                        sku: true,
                    },
                },
            },
            orderBy: {
                expirationDate: 'asc',
            },
        });
    }
    async adjustStock(organizationId, productId, quantityDelta, reason, performedBy, notes, batchId) {
        console.warn(`DEPRECATED: InventoryService.adjustStock() called for product ${productId}. ` +
            'Use StockMovementService.adjustStock() instead.');
        await this.ensureInventoryItem(productId, organizationId);
        return this.prisma.inventoryItem.update({
            where: {
                productId_organizationId: {
                    productId,
                    organizationId,
                },
            },
            data: {
                quantity: {
                    increment: quantityDelta,
                },
            },
        });
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map