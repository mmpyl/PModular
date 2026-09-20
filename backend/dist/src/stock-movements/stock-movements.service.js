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
exports.StockMovementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const client_1 = require("@prisma/client");
let StockMovementService = class StockMovementService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async adjustStock(productId, organizationId, quantityDelta, reason, performedBy, options) {
        return this.prisma.$transaction((tx) => this.adjustStockInTransaction(tx, productId, organizationId, quantityDelta, reason, performedBy, options));
    }
    async adjustStockInTransaction(tx, productId, organizationId, quantityDelta, reason, performedBy, options) {
        const isPositive = quantityDelta > 0;
        const quantity = Math.abs(quantityDelta);
        const { batchId: providedBatchId, referenceType, referenceId, notes, unitCost, batchNumber, expirationDate, } = options || {};
        let inventoryItem = await tx.inventoryItem.upsert({
            where: {
                productId_organizationId: {
                    productId,
                    organizationId,
                },
            },
            update: {},
            create: {
                productId,
                organizationId,
                quantity: 0,
                reserved: 0,
                averageCost: 0,
            },
        });
        let batch = null;
        let finalBatchId = providedBatchId;
        if (isPositive && batchNumber) {
            const upsertedBatch = await tx.batch.upsert({
                where: {
                    productId_batchNumber_organizationId: {
                        productId,
                        batchNumber,
                        organizationId,
                    },
                },
                update: {
                    currentQuantity: { increment: quantity },
                    initialQuantity: { increment: quantity },
                    ...(unitCost ? { unitCost } : {}),
                    ...(expirationDate ? { expirationDate } : {}),
                },
                create: {
                    productId,
                    organizationId,
                    batchNumber,
                    serialNumber: null,
                    manufacturingDate: null,
                    expirationDate: expirationDate || null,
                    status: client_1.BatchStatus.ACTIVO,
                    initialQuantity: quantity,
                    currentQuantity: quantity,
                    unitCost: unitCost || 0,
                    location: null,
                },
            });
            batch = upsertedBatch;
            finalBatchId = upsertedBatch.id;
        }
        else if (finalBatchId) {
            const foundBatch = await tx.batch.findUnique({
                where: { id: finalBatchId },
            });
            if (!foundBatch) {
                throw new common_1.NotFoundException(`Batch ${finalBatchId} not found`);
            }
            batch = foundBatch;
            if (!isPositive && Number(foundBatch.currentQuantity) < quantity) {
                throw new common_1.BadRequestException(`Insufficient stock in batch ${finalBatchId}. Available: ${foundBatch.currentQuantity}, Required: ${quantity}`);
            }
            const newQuantity = isPositive
                ? Number(foundBatch.currentQuantity) + quantity
                : Number(foundBatch.currentQuantity) - quantity;
            let newStatus = foundBatch.status;
            if (newQuantity <= 0) {
                newStatus = client_1.BatchStatus.AGOTADO;
            }
            else if (foundBatch.expirationDate && foundBatch.expirationDate < new Date()) {
                newStatus = client_1.BatchStatus.VENCIDO;
            }
            batch = await tx.batch.update({
                where: { id: finalBatchId },
                data: {
                    currentQuantity: Math.max(0, newQuantity),
                    status: newStatus,
                    ...(unitCost && isPositive ? { unitCost } : {}),
                },
            });
        }
        else if (!isPositive) {
            const oldestBatch = await tx.batch.findFirst({
                where: {
                    productId,
                    organizationId,
                    currentQuantity: { gte: quantity },
                    status: 'ACTIVO',
                },
                orderBy: { expirationDate: 'asc' },
            });
            if (!oldestBatch) {
                throw new common_1.BadRequestException(`Insufficient stock for product ${productId}. Required: ${quantity}`);
            }
            finalBatchId = oldestBatch.id;
            batch = oldestBatch;
            const newQuantity = Number(oldestBatch.currentQuantity) - quantity;
            let newStatus = oldestBatch.status;
            if (newQuantity <= 0) {
                newStatus = client_1.BatchStatus.AGOTADO;
            }
            batch = await tx.batch.update({
                where: { id: finalBatchId },
                data: {
                    currentQuantity: newQuantity,
                    status: newStatus,
                },
            });
        }
        const movement = await tx.stockMovement.create({
            data: {
                organizationId,
                productId,
                type: isPositive ? client_1.MovementType.INGRESO : client_1.MovementType.SALIDA,
                reason,
                quantity,
                isPositive,
                batchId: finalBatchId,
                referenceType,
                referenceId,
                notes,
                performedBy,
            },
        });
        inventoryItem = await this.recalculateInventoryInTransaction(tx, productId, organizationId);
        return {
            movement,
            inventoryItem,
            batch,
        };
    }
    async createStockMovement(dto) {
        const result = await this.adjustStock(dto.productId, dto.organizationId, dto.type === 'INGRESO' ? dto.quantity : -dto.quantity, dto.reason, dto.performedBy, {
            batchId: dto.batchId,
            referenceType: dto.referenceType,
            referenceId: dto.referenceId,
            notes: dto.notes,
        });
        return result.movement;
    }
    async getMovements(organizationId, filters) {
        const where = { organizationId };
        if (filters?.productId) {
            where.productId = filters.productId;
        }
        if (filters?.type) {
            where.type = filters.type;
        }
        if (filters?.reason) {
            where.reason = filters.reason;
        }
        if (filters?.referenceType && filters?.referenceId) {
            where.referenceType = filters.referenceType;
            where.referenceId = filters.referenceId;
        }
        return this.prisma.stockMovement.findMany({
            where,
            include: {
                product: {
                    select: {
                        name: true,
                        sku: true,
                    },
                },
                batch: {
                    select: {
                        batchNumber: true,
                        serialNumber: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async getMovementById(organizationId, id) {
        const movement = await this.prisma.stockMovement.findUnique({
            where: { id, organizationId },
            include: {
                product: true,
                batch: true,
            },
        });
        if (!movement) {
            throw new common_1.NotFoundException(`Stock movement ${id} not found`);
        }
        return movement;
    }
    async recalculateInventoryInTransaction(tx, productId, organizationId) {
        const batches = await tx.batch.findMany({
            where: {
                productId,
                organizationId,
                status: {
                    in: ['ACTIVO', 'RETENIDO'],
                },
            },
        });
        const totalQuantity = batches.reduce((sum, batch) => sum + Number(batch.currentQuantity), 0);
        const totalValue = batches.reduce((sum, batch) => sum + Number(batch.currentQuantity) * Number(batch.unitCost), 0);
        const averageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;
        return tx.inventoryItem.upsert({
            where: {
                productId_organizationId: {
                    productId,
                    organizationId,
                },
            },
            update: {
                quantity: totalQuantity,
                averageCost,
            },
            create: {
                productId,
                organizationId,
                quantity: totalQuantity,
                reserved: 0,
                averageCost,
            },
        });
    }
    async recalculateInventory(productId, organizationId) {
        console.warn(`DEPRECATED: StockMovementService.recalculateInventory() called for product ${productId}. ` +
            'This should not be needed as adjustStock() already recalculates inventory automatically.');
        const batches = await this.prisma.batch.findMany({
            where: {
                productId,
                organizationId,
                status: {
                    in: ['ACTIVO', 'RETENIDO'],
                },
            },
        });
        const totalQuantity = batches.reduce((sum, batch) => sum + Number(batch.currentQuantity), 0);
        const totalValue = batches.reduce((sum, batch) => sum + Number(batch.currentQuantity) * Number(batch.unitCost), 0);
        const averageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;
        return this.prisma.inventoryItem.upsert({
            where: {
                productId_organizationId: {
                    productId,
                    organizationId,
                },
            },
            update: {
                quantity: totalQuantity,
                averageCost,
            },
            create: {
                productId,
                organizationId,
                quantity: totalQuantity,
                reserved: 0,
                averageCost,
            },
        });
    }
    async registerInitialStock(productId, organizationId, quantity, unitCost, batchNumber, expirationDate, performedBy) {
        const result = await this.adjustStock(productId, organizationId, quantity, 'ENTRADA_INICIAL', performedBy || 'system', {
            batchNumber,
            expirationDate,
            unitCost,
        });
        return {
            movement: result.movement,
            batch: result.batch ?? undefined,
        };
    }
};
exports.StockMovementService = StockMovementService;
exports.StockMovementService = StockMovementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockMovementService);
//# sourceMappingURL=stock-movements.service.js.map