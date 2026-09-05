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
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let OrganizationsService = class OrganizationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const businessType = await this.prisma.businessType.findUnique({
            where: { id: data.businessTypeId },
        });
        if (!businessType) {
            throw new common_1.NotFoundException(`BusinessType con ID ${data.businessTypeId} no encontrado`);
        }
        const enabledModules = data.enabledModules || businessType.defaultModules || [];
        return this.prisma.organization.create({
            data: {
                name: data.name,
                businessTypeId: data.businessTypeId,
                enabledModules,
                settings: data.settings || {},
            },
            include: {
                businessType: true,
            },
        });
    }
    findAll() {
        return this.prisma.organization.findMany({
            include: {
                businessType: true,
            },
            orderBy: { name: 'asc' },
        });
    }
    findOne(id) {
        return this.prisma.organization.findUnique({
            where: { id },
            include: {
                businessType: true,
            },
        });
    }
    async update(id, data) {
        const existing = await this.prisma.organization.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Organización con ID ${id} no encontrada`);
        }
        return this.prisma.organization.update({
            where: { id },
            data,
        });
    }
    async remove(id) {
        const existing = await this.prisma.organization.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Organización con ID ${id} no encontrada`);
        }
        return this.prisma.organization.delete({
            where: { id },
        });
    }
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map