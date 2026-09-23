import { Controller, Get, Param, Query, UseGuards, Patch, Body } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { PlatformRoles, ALLOWED_PLATFORM_ROLES } from '../auth/decorators/org-roles.decorator';
import { PlatformPaginationQueryDto } from './dto/platform-pagination-query.dto';
import { PaginatedPlatformResult, PlatformOrganizationResponse, PlatformUserResponse, PlatformMetricsResponse } from './dto/platform-response.dto';
import { UpdatePlatformRoleDto } from './dto/update-platform-role.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PlatformRole } from '@prisma/client';

/**
 * Módulo de plataforma para administración global.
 * Todos los endpoints están protegidos con JwtAuthGuard + PlatformRolesGuard.
 * No usa TenantGuard porque Owen (plataforma) nunca tendrá organizationId.
 */
@Controller('platform')
@UseGuards(JwtAuthGuard, PlatformRolesGuard)
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  /**
   * GET /platform/organizations
   * Listado paginado/búsqueda de todas las organizaciones.
   * Requiere rol PLATFORM_ADMIN o SUPPORT.
   */
  @Get('organizations')
  @PlatformRoles(...ALLOWED_PLATFORM_ROLES)
  async findOrganizations(
    @Query() query: PlatformPaginationQueryDto,
  ): Promise<PaginatedPlatformResult<PlatformOrganizationResponse>> {
    return this.platformService.findOrganizations(query);
  }

  /**
   * GET /platform/organizations/:id
   * Detalle completo de una organización, incluidos sus miembros.
   * Requiere rol PLATFORM_ADMIN o SUPPORT.
   */
  @Get('organizations/:id')
  @PlatformRoles(...ALLOWED_PLATFORM_ROLES)
  async findOrganizationById(
    @Param('id') id: string,
  ): Promise<PlatformOrganizationResponse> {
    return this.platformService.findOrganizationById(id);
  }

  /**
   * GET /platform/users
   * Listado/búsqueda de usuarios del sistema.
   * Requiere rol PLATFORM_ADMIN o SUPPORT.
   */
  @Get('users')
  @PlatformRoles(...ALLOWED_PLATFORM_ROLES)
  async findUsers(
    @Query() query: PlatformPaginationQueryDto,
  ): Promise<PaginatedPlatformResult<PlatformUserResponse>> {
    return this.platformService.findUsers(query);
  }

  /**
   * GET /platform/metrics
   * Métricas agregadas de la plataforma: totales de organizaciones, usuarios,
   * altas recientes y actividad reciente (basado en AuditLog).
   * Requiere rol PLATFORM_ADMIN o SUPPORT.
   */
  @Get('metrics')
  @PlatformRoles(...ALLOWED_PLATFORM_ROLES)
  async getMetrics(): Promise<PlatformMetricsResponse> {
    return this.platformService.getMetrics();
  }

  /**
   * PATCH /platform/users/:id/role
   * Actualiza el rol de plataforma de un usuario.
   * Solo permitido para PLATFORM_ADMIN (no para SUPPORT, para evitar auto-promoción).
   * Incluye protección contra dejar al último PLATFORM_ADMIN sin rol.
   */
  @Patch('users/:id/role')
  @PlatformRoles(PlatformRole.PLATFORM_ADMIN)
  async updatePlatformRole(
    @Param('id') userId: string,
    @Body() updateRoleDto: UpdatePlatformRoleDto,
    @CurrentUser() currentUser: { sub: string },
  ) {
    return this.platformService.updatePlatformRole(
      userId,
      currentUser.sub,
      updateRoleDto.role ?? null,
    );
  }
}
