import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PlatformPaginationQueryDto } from './dto/platform-pagination-query.dto';
import { PaginatedPlatformResult, PlatformOrganizationResponse, PlatformUserResponse, PlatformMetricsResponse, RecentActivity } from './dto/platform-response.dto';
import { Prisma, AuditActionType, PlatformRole } from '@prisma/client';

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

  /**
   * Obtiene métricas agregadas de la plataforma
   */
  async getMetrics(): Promise<PlatformMetricsResponse> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Totales de organizaciones
    const [totalOrganizations, activeOrganizations, suspendedOrganizations] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.organization.count({ where: { status: 'ACTIVE' } }),
      this.prisma.organization.count({ where: { status: 'SUSPENDED' } }),
    ]);

    // Total de usuarios
    const totalUsers = await this.prisma.user.count();

    // Altas de organizaciones en los últimos 7 y 30 días
    const [organizationsLast7Days, organizationsLast30Days] = await Promise.all([
      this.prisma.organization.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.organization.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    // Actividad reciente basada en AuditLog (últimos 7 días)
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

    const recentActivity: RecentActivity[] = recentAuditLogs.map((log) => ({
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

  /**
   * Actualiza el rol de plataforma de un usuario.
   * Solo PLATFORM_ADMIN puede ejecutar esta operación.
   * 
   * Reglas de seguridad:
   * 1. No permitir que el último PLATFORM_ADMIN se quite el rol a sí mismo
   * 2. No permitir que quede ningún usuario sin ningún admin de plataforma
   * 3. Solo PLATFORM_ADMIN puede asignar/revocar roles (no SUPPORT)
   */
  async updatePlatformRole(
    targetUserId: string,
    requestingUserId: string,
    newRole: PlatformRole | null,
  ): Promise<{ id: string; email: string; platformRole: PlatformRole | null }> {
    // Verificar que el usuario objetivo existe
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        platformRole: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException(`Usuario con ID ${targetUserId} no encontrado`);
    }

    // Si se está quitando el rol (newRole === null), verificar que no sea el último PLATFORM_ADMIN
    if (newRole === null || newRole === undefined) {
      // Contar cuántos PLATFORM_ADMIN hay actualmente
      const platformAdminCount = await this.prisma.user.count({
        where: {
          platformRole: PlatformRole.PLATFORM_ADMIN,
        },
      });

      // Si el usuario objetivo es PLATFORM_ADMIN y es el único, no permitir quitarle el rol
      if (targetUser.platformRole === PlatformRole.PLATFORM_ADMIN && platformAdminCount <= 1) {
        throw new ForbiddenException(
          'No se puede remover el rol del último PLATFORM_ADMIN. Debe haber al menos un administrador de plataforma.',
        );
      }
    }

    // Si se está cambiando a PLATFORM_ADMIN desde otro rol, o viceversa, verificar la misma regla
    if (newRole !== PlatformRole.PLATFORM_ADMIN && targetUser.platformRole === PlatformRole.PLATFORM_ADMIN) {
      // Contar cuántos PLATFORM_ADMIN hay actualmente (incluyendo al usuario objetivo)
      const platformAdminCount = await this.prisma.user.count({
        where: {
          platformRole: PlatformRole.PLATFORM_ADMIN,
        },
      });

      // Si es el único PLATFORM_ADMIN, no permitir el cambio
      if (platformAdminCount <= 1) {
        throw new ForbiddenException(
          'No se puede degradar al último PLATFORM_ADMIN. Debe haber al menos un administrador de plataforma.',
        );
      }
    }

    // Actualizar el rol
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
}
