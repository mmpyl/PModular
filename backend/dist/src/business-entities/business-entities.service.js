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
};
exports.BusinessEntitiesService = BusinessEntitiesService;
exports.BusinessEntitiesService = BusinessEntitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BusinessEntitiesService);
//# sourceMappingURL=business-entities.service.js.map