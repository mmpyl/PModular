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
};
exports.PlatformService = PlatformService;
exports.PlatformService = PlatformService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlatformService);
//# sourceMappingURL=platform.service.js.map