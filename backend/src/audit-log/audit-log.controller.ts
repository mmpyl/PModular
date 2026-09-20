import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { PlatformRoles, ALLOWED_PLATFORM_ROLES } from '../auth/decorators/org-roles.decorator';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { PaginatedAuditLogResult } from './dto/audit-log-response.dto';

/**
 * Módulo de auditoría para trazabilidad de acciones sensibles.
 * Todos los endpoints están protegidos con JwtAuthGuard + PlatformRolesGuard.
 */
@Controller('platform/audit-log')
@UseGuards(JwtAuthGuard, PlatformRolesGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * GET /platform/audit-log
   * Obtiene logs de auditoría con filtros opcionales:
   * - organizationId: Filtrar por organización
   * - userId: Filtrar por usuario que realizó la acción
   * - action: Filtrar por tipo de acción (ej: ORGANIZATION_SUSPENDED)
   * - entityType: Filtrar por tipo de entidad (ej: Organization, User, Membership)
   * - entityId: Filtrar por ID de entidad específica
   * - startDate: Fecha inicial (ISO 8601)
   * - endDate: Fecha final (ISO 8601)
   * - page: Número de página (default: 1)
   * - pageSize: Tamaño de página (default: 20)
   * 
   * Requiere rol PLATFORM_ADMIN o SUPPORT.
   */
  @Get()
  @PlatformRoles(...ALLOWED_PLATFORM_ROLES)
  async findAll(
    @Query() query: AuditLogQueryDto,
  ): Promise<PaginatedAuditLogResult> {
    return this.auditLogService.findAll(query);
  }
}
