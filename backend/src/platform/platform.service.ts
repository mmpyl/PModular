import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PlatformPaginationQueryDto } from './dto/platform-pagination-query.dto';
import { PaginatedPlatformResult, PlatformOrganizationResponse, PlatformUserResponse } from './dto/platform-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Listado paginado de todas las organizaciones con búsqueda opcional
   */
  async findOrganizations(
    query: PlatformPaginationQueryDto,
  ): Promise<PaginatedPlatformResult<PlatformOrganizationResponse>> {
    const { skip, take, search } = query;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { businessType: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } },
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

  /**
   * Detalle completo de una organización incluyendo sus miembros
   */
  async findOrganizationById(id: string): Promise<PlatformOrganizationResponse> {
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
      throw new NotFoundException(`Organización con ID ${id} no encontrada`);
    }

    // Transformar memberships a members
    const { memberships, ...orgData } = organization;
    
    return {
      ...orgData,
      members: memberships.map((m: any) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        user: m.user,
      })),
    };
  }

  /**
   * Listado paginado de todos los usuarios del sistema con búsqueda opcional
   */
  async findUsers(
    query: PlatformPaginationQueryDto,
  ): Promise<PaginatedPlatformResult<PlatformUserResponse>> {
    const { skip, take, search } = query;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
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
}
