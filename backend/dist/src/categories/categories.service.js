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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let CategoriesService = class CategoriesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(organizationId, data) {
        return this.prisma.category.create({
            data: {
                organizationId,
                name: data.name,
                parentId: data.parentId,
            },
            include: {
                parent: true,
            },
        });
    }
    findAll(organizationId) {
        return this.prisma.category.findMany({
            where: { organizationId },
            include: {
                parent: true,
                _count: { select: { products: true } },
            },
            orderBy: { name: 'asc' },
        });
    }
    findOne(organizationId, id) {
        return this.prisma.category.findUnique({
            where: { id, organizationId },
            include: {
                parent: true,
                children: true,
                products: { take: 10, select: { id: true, name: true, sku: true } },
            },
        });
    }
    async update(organizationId, id, data) {
        const existing = await this.prisma.category.findUnique({
            where: { id, organizationId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Categoría con ID ${id} no encontrada en esta organización`);
        }
        return this.prisma.category.update({
            where: { id, organizationId },
            data,
        });
    }
    async remove(organizationId, id) {
        const existing = await this.prisma.category.findUnique({
            where: { id, organizationId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Categoría con ID ${id} no encontrada en esta organización`);
        }
        return this.prisma.category.delete({
            where: { id, organizationId },
        });
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map