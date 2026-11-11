import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, ForbiddenException, UseInterceptors } from '@nestjs/common';
import { OrganizationsService, BusinessSettingsDto } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { OrgRoles, PlatformRoles } from '../auth/decorators/org-roles.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { Reflector } from '@nestjs/core';
import { AuditLogInterceptor, AuditAction, AuditEntityType } from '../audit-log/audit-log.interceptor';
import { AuditActionType } from '@prisma/client';

export interface CreateOrganizationDto {
  name: string;
  businessTypeId: string;
  enabledModules?: string[];
  settings?: Record<string, any>;
}

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createOrgDto: CreateOrganizationDto, @CurrentUser() user: { sub: string }) {
    return this.organizationsService.create(createOrgDto, user.sub);
  }

  @Get()
  @UseGuards(TenantGuard)
  findAll(@CurrentOrg() organizationId: string) {
    return this.organizationsService.findAll(organizationId);
  }

  @Get(':id')
  @UseGuards(TenantGuard)
  findOne(@Param('id') id: string, @CurrentOrg() organizationId: string) {
    // Validar que el ID de la organización coincida con la organización del JWT
    if (id !== organizationId) {
      throw new ForbiddenException('No tienes acceso a esta organización');
    }
    return this.organizationsService.findOne(id);
  }

  @Get(':id/settings')
  @UseGuards(TenantGuard)
  async getBusinessSettings(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
  ): Promise<BusinessSettingsDto> {
    if (id !== organizationId) {
      throw new ForbiddenException('No tienes acceso a esta organización');
    }
    return this.organizationsService.getBusinessSettings(id);
  }

  @Patch(':id')
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles('OWNER')
  update(
    @Param('id') id: string,
    @Body() updateOrgDto: Partial<CreateOrganizationDto>,
    @CurrentOrg() organizationId: string,
  ) {
    if (id !== organizationId) {
      throw new ForbiddenException('No puedes editar otra organización');
    }
    return this.organizationsService.update(id, updateOrgDto);
  }

  @Delete(':id')
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles('OWNER')
  remove(@Param('id') id: string, @CurrentOrg() organizationId: string) {
    // Validar que el ID de la organización coincida con la organización del JWT
    if (id !== organizationId) {
      throw new ForbiddenException('No puedes eliminar una organización que no te pertenece');
    }
    return this.organizationsService.remove(id);
  }
}

// ==========================================
// FASE 4: Suspensión de organizaciones (moderación de plataforma)
// Endpoints solo accesibles para PLATFORM_ADMIN
// ==========================================
@Controller('platform/organizations')
@UseGuards(JwtAuthGuard, PlatformRolesGuard)
@UseInterceptors(AuditLogInterceptor)
export class PlatformOrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  /**
   * Suspender una organización - Solo PLATFORM_ADMIN
   * La suspensión surte efecto inmediato gracias a la verificación en TenantGuard
   */
  @Patch(':id/suspend')
  @PlatformRoles('PLATFORM_ADMIN')
  @AuditAction(AuditActionType.ORGANIZATION_SUSPENDED)
  @AuditEntityType('Organization')
  async suspend(@Param('id') id: string) {
    return this.organizationsService.suspendOrganization(id);
  }

  /**
   * Reactivar una organización suspendida - Solo PLATFORM_ADMIN
   */
  @Patch(':id/reactivate')
  @PlatformRoles('PLATFORM_ADMIN')
  @AuditAction(AuditActionType.ORGANIZATION_REACTIVATED)
  @AuditEntityType('Organization')
  async reactivate(@Param('id') id: string) {
    return this.organizationsService.reactivateOrganization(id);
  }
}
