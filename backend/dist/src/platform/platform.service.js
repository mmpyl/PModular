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
exports.PlatformService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const client_1 = require("@prisma/client");
let PlatformService = class PlatformService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOrganizations(query) {
        const { skip, take, search } = query;
        const where = search
            ? {
                OR: [
                    { name: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } },
                    { businessType: { name: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } } },
                ],
            }
            : {};
        const [organizations, total] = await Promise.all([
            this.prisma.organization.findMany({
                where,
                skip,
                take,
                include: {
                    businessType: true,
                },
                orderBy: { name: 'asc' },
            }),
            this.prisma.organization.count({ where }),
        ]);
        const totalPages = Math.ceil(total / take);
        return {
            data: organizations.map((org) => ({
                ...org,
                businessType: org.businessType,
            })),
            meta: {
                page: query.page,
                pageSize: query.pageSize,
                total,
                totalPages,
            },
        };
    }
    async findOrganizationById(id) {
        const organization = await this.prisma.organization.findUnique({
            where: { id },
            include: {
                businessType: true,
                memberships: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: { role: 'asc' },
                },
            },
        });
        if (!organization) {
            throw new common_1.NotFoundException(`Organización con ID ${id} no encontrada`);
        }
        const { memberships, ...orgData } = organization;
        return {
            ...orgData,
            members: memberships.map((m) => ({
                id: m.id,
                userId: m.userId,
                role: m.role,
                user: m.user,
            })),
        };
    }
    async findUsers(query) {
        const { skip, take, search } = query;
        const where = search
            ? {
                OR: [
                    { email: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } },
                    { name: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } },
                ],
            }
            : {};
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    platformRole: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            memberships: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);
        const totalPages = Math.ceil(total / take);
        return {
            data: users,
            meta: {
                page: query.page,
                pageSize: query.pageSize,
                total,
                totalPages,
            },
        };
    }
    async getMetrics() {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const [totalOrganizations, activeOrganizations, suspendedOrganizations] = await Promise.all([
            this.prisma.organization.count(),
            this.prisma.organization.count({ where: { status: 'ACTIVE' } }),
            this.prisma.organization.count({ where: { status: 'SUSPENDED' } }),
        ]);
        const totalUsers = await this.prisma.user.count();
        const [organizationsLast7Days, organizationsLast30Days] = await Promise.all([
            this.prisma.organization.count({
                where: { createdAt: { gte: sevenDaysAgo } },
            }),
            this.prisma.organization.count({
                where: { createdAt: { gte: thirtyDaysAgo } },
            }),
        ]);
        const recentAuditLogs = await this.prisma.auditLog.findMany({
            where: {
                createdAt: { gte: sevenDaysAgo },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        platformRole: true,
                    },
                },
                organization: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        const recentActivity = recentAuditLogs.map((log) => ({
            id: log.id,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            timestamp: log.createdAt,
            userName: log.user?.name ?? log.user?.email ?? 'Desconocido',
            organizationName: log.organization?.name ?? null,
        }));
        return {
            organizations: {
                total: totalOrganizations,
                active: activeOrganizations,
                suspended: suspendedOrganizations,
                newLast7Days: organizationsLast7Days,
                newLast30Days: organizationsLast30Days,
            },
            users: {
                total: totalUsers,
            },
            recentActivity,
        };
    }
    async updatePlatformRole(targetUserId, requestingUserId, newRole) {
        const targetUser = await this.prisma.user.findUnique({
            where: { id: targetUserId },
            select: {
                id: true,
                email: true,
                platformRole: true,
            },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException(`Usuario con ID ${targetUserId} no encontrado`);
        }
        if (newRole === null || newRole === undefined) {
            const platformAdminCount = await this.prisma.user.count({
                where: {
                    platformRole: client_1.PlatformRole.PLATFORM_ADMIN,
                },
            });
            if (targetUser.platformRole === client_1.PlatformRole.PLATFORM_ADMIN && platformAdminCount <= 1) {
                throw new common_1.ForbiddenException('No se puede remover el rol del último PLATFORM_ADMIN. Debe haber al menos un administrador de plataforma.');
            }
        }
        if (newRole !== client_1.PlatformRole.PLATFORM_ADMIN && targetUser.platformRole === client_1.PlatformRole.PLATFORM_ADMIN) {
            const platformAdminCount = await this.prisma.user.count({
                where: {
                    platformRole: client_1.PlatformRole.PLATFORM_ADMIN,
                },
            });
            if (platformAdminCount <= 1) {
                throw new common_1.ForbiddenException('No se puede degradar al último PLATFORM_ADMIN. Debe haber al menos un administrador de plataforma.');
            }
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: targetUserId },
            data: { platformRole: newRole },
            select: {
                id: true,
                email: true,
                platformRole: true,
            },
        });
        return updatedUser;
    }
};
exports.PlatformService = PlatformService;
exports.PlatformService = PlatformService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlatformService);
//# sourceMappingURL=platform.service.js.map