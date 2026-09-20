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
exports.BatchesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const client_1 = require("@prisma/client");
let BatchesService = class BatchesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createBatch(dto) {
        const { productId, batchNumber, organizationId } = dto;
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product ${productId} not found`);
        }
        const existing = await this.prisma.batch.findUnique({
            where: {
                productId_batchNumber_organizationId: {
                    productId,
                    batchNumber,
                    organizationId,
                },
            },
        });
        if (existing) {
            throw new common_1.NotFoundException(`Batch with number ${batchNumber} already exists for product ${productId}`);
        }
        return this.prisma.batch.create({
            data: {
                ...dto,
                currentQuantity: dto.initialQuantity,
                status: client_1.BatchStatus.ACTIVO,
            },
            include: {
                product: {
                    select: {
                        name: true,
                        sku: true,
                    },
                },
            },
        });
    }
    async getBatches(organizationId, filters) {
        const where = { organizationId };
        if (filters?.productId) {
            where.productId = filters.productId;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.expiringSoon) {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + (filters.daysThreshold || 30));
            where.expirationDate = {
                lte: futureDate,
                not: null,
            };
            where.status = 'ACTIVO';
        }
        return this.prisma.batch.findMany({
            where,
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
    async getBatchById(organizationId, id) {
        const batch = await this.prisma.batch.findUnique({
            where: { id, organizationId },
            include: {
                product: true,
                movements: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
        if (!batch) {
            throw new common_1.NotFoundException(`Batch ${id} not found`);
        }
        return batch;
    }
    async updateBatch(organizationId, id, dto) {
        const existing = await this.prisma.batch.findUnique({
            where: { id, organizationId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Batch ${id} not found`);
        }
        return this.prisma.batch.update({
            where: { id },
            data: dto,
        });
    }
    async retainBatch(organizationId, id, reason) {
        return this.updateBatch(organizationId, id, {
            status: client_1.BatchStatus.RETENIDO,
        });
    }
    async releaseBatch(organizationId, id) {
        return this.updateBatch(organizationId, id, {
            status: client_1.BatchStatus.ACTIVO,
        });
    }
    async markAsExpired(organizationId, id) {
        return this.updateBatch(organizationId, id, {
            status: client_1.BatchStatus.VENCIDO,
        });
    }
    async getBatchStats(organizationId) {
        const batches = await this.prisma.batch.findMany({
            where: { organizationId },
            select: {
                status: true,
                currentQuantity: true,
                expirationDate: true,
            },
        });
        const stats = {
            total: batches.length,
            byStatus: {
                ACTIVO: 0,
                RETENIDO: 0,
                VENCIDO: 0,
                AGOTADO: 0,
            },
            expiringSoon: 0,
            expired: 0,
            totalValue: 0,
        };
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        batches.forEach((batch) => {
            const status = batch.status;
            if (status) {
                stats.byStatus[status]++;
            }
            if (batch.expirationDate) {
                if (batch.expirationDate < today) {
                    stats.expired++;
                }
                else if (batch.expirationDate < thirtyDaysFromNow) {
                    stats.expiringSoon++;
                }
            }
            stats.totalValue +=
                Number(batch.currentQuantity) * Number(batch.unitCost || 0);
        });
        return stats;
    }
};
exports.BatchesService = BatchesService;
exports.BatchesService = BatchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BatchesService);
//# sourceMappingURL=batches.service.js.map