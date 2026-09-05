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
exports.MembershipsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let MembershipsService = class MembershipsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
        if (!user) {
            throw new common_1.NotFoundException(`Usuario con ID ${data.userId} no encontrado`);
        }
        const org = await this.prisma.organization.findUnique({ where: { id: data.organizationId } });
        if (!org) {
            throw new common_1.NotFoundException(`Organización con ID ${data.organizationId} no encontrada`);
        }
        return this.prisma.membership.create({
            data: {
                userId: data.userId,
                organizationId: data.organizationId,
                role: data.role || 'VENDEDOR',
            },
            include: {
                user: { select: { id: true, email: true, name: true } },
                organization: { select: { id: true, name: true } },
            },
        });
    }
    findByUser(userId) {
        return this.prisma.membership.findMany({
            where: { userId },
            include: {
                organization: {
                    include: { businessType: true },
                },
            },
        });
    }
    findByOrganization(organizationId) {
        return this.prisma.membership.findMany({
            where: { organizationId },
            include: {
                user: { select: { id: true, email: true, name: true } },
            },
        });
    }
    findOne(userId, organizationId) {
        return this.prisma.membership.findUnique({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId,
                },
            },
            include: {
                user: { select: { id: true, email: true, name: true } },
                organization: { select: { id: true, name: true } },
            },
        });
    }
    async updateRole(userId, organizationId, role) {
        const existing = await this.prisma.membership.findUnique({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId,
                },
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Membresía no encontrada');
        }
        return this.prisma.membership.update({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId,
                },
            },
            data: { role },
        });
    }
    async remove(userId, organizationId) {
        const existing = await this.prisma.membership.findUnique({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId,
                },
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Membresía no encontrada');
        }
        return this.prisma.membership.delete({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId,
                },
            },
        });
    }
};
exports.MembershipsService = MembershipsService;
exports.MembershipsService = MembershipsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MembershipsService);
//# sourceMappingURL=memberships.service.js.map