import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { PaginatedAuditLogResult } from './dto/audit-log-response.dto';
import { AuditActionType, Prisma } from '@prisma/client';

export interface CreateAuditLogParams {
  userId?: string;
  userPlatformRole?: string;
  action: AuditActionType;
  entityType: string;
  entityId: string;
  organizationId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra una acción en el audit log
   */
  async create(params: CreateAuditLogParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          userPlatformRole: params.userPlatformRole,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          organizationId: params.organizationId,
          metadata: params.metadata || {},
        },
      });
      this.logger.debug(
        `Audit log created: ${params.action} on ${params.entityType}(${params.entityId})`,
      );
    } catch (error) {
      // No bloquear la operación principal si falla el audit log
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
    }
  }

  /**
   * Obtiene logs de auditoría con filtros y paginación
   */
  async findAll(query: AuditLogQueryDto): Promise<PaginatedAuditLogResult> {
    const {
      organizationId,
      userId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
      page = 1,
      pageSize = 20,
    } = query;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Construir where clause dinámicamente
    const where: Prisma.AuditLogWhereInput = {};

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    // Filtro por rango de fechas
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
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
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: logs.map((log) => ({
        ...log,
        metadata: log.metadata as Record<string, any>,
      })),
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  /**
   * Métodos helper para acciones comunes
   */

  async logOrganizationSuspended(
    organizationId: string,
    userId?: string,
    userPlatformRole?: string,
    reason?: string,
  ): Promise<void> {
    await this.create({
      userId,
      userPlatformRole,
      action: AuditActionType.ORGANIZATION_SUSPENDED,
      entityType: 'Organization',
      entityId: organizationId,
      organizationId,
      metadata: { reason },
    });
  }

  async logOrganizationReactivated(
    organizationId: string,
    userId?: string,
    userPlatformRole?: string,
  ): Promise<void> {
    await this.create({
      userId,
      userPlatformRole,
      action: AuditActionType.ORGANIZATION_REACTIVATED,
      entityType: 'Organization',
      entityId: organizationId,
      organizationId,
    });
  }

  async logMemberAdded(
    organizationId: string,
    membershipId: string,
    userId: string,
    memberId: string,
    role: string,
  ): Promise<void> {
    await this.create({
      userId,
      action: AuditActionType.MEMBER_ADDED,
      entityType: 'Membership',
      entityId: membershipId,
      organizationId,
      metadata: { memberId, role },
    });
  }

  async logMemberRemoved(
    organizationId: string,
    membershipId: string,
    userId: string,
    removedMemberId: string,
    previousRole: string,
  ): Promise<void> {
    await this.create({
      userId,
      action: AuditActionType.MEMBER_REMOVED,
      entityType: 'Membership',
      entityId: membershipId,
      organizationId,
      metadata: { removedMemberId, previousRole },
    });
  }

  async logMemberRoleChanged(
    organizationId: string,
    membershipId: string,
    userId: string,
    targetMemberId: string,
    previousRole: string,
    newRole: string,
  ): Promise<void> {
    await this.create({
      userId,
      action: AuditActionType.MEMBER_ROLE_CHANGED,
      entityType: 'Membership',
      entityId: membershipId,
      organizationId,
      metadata: { targetMemberId, previousRole, newRole },
    });
  }
}
