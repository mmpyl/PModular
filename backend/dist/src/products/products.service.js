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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let ProductsService = class ProductsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(organizationId, data) {
        return this.prisma.product.create({
            data: {
                organizationId,
                name: data.name,
                sku: data.sku,
                description: data.description,
                price: data.price,
                cost: data.cost,
                categoryId: data.categoryId,
                unitId: data.unitId,
                attributes: data.attributes || {},
                isActive: data.isActive ?? true,
            },
            include: {
                category: true,
                unit: true,
            },
        });
    }
    findAll(organizationId, options) {
        const where = { organizationId };
        if (options?.categoryId) {
            where.categoryId = options.categoryId;
        }
        if (options?.search) {
            where.OR = [
                { name: { contains: options.search, mode: 'insensitive' } },
                { sku: { contains: options.search, mode: 'insensitive' } },
            ];
        }
        return this.prisma.product.findMany({
            where,
            include: {
                category: true,
                unit: true,
            },
            orderBy: { name: 'asc' },
        });
    }
    findOne(organizationId, id) {
        return this.prisma.product.findUnique({
            where: { id, organizationId },
            include: {
                category: true,
                unit: true,
            },
        });
    }
    async update(organizationId, id, data) {
        const existing = await this.prisma.product.findUnique({
            where: { id, organizationId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Producto con ID ${id} no encontrado en esta organización`);
        }
        return this.prisma.product.update({
            where: { id, organizationId },
            data,
        });
    }
    async remove(organizationId, id) {
        const existing = await this.prisma.product.findUnique({
            where: { id, organizationId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Producto con ID ${id} no encontrado en esta organización`);
        }
        return this.prisma.product.delete({
            where: { id, organizationId },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map