import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { OrgRole } from '@prisma/client';

export interface CreateOrganizationDto {
  name: string;
  businessTypeId: string;
  enabledModules?: string[];
  settings?: Record<string, any>;
}

@Controller('organizations')
@UseGuards(JwtAuthGuard, TenantGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@Body() createOrgDto: CreateOrganizationDto, @CurrentOrg() organizationId: string) {
    return this.organizationsService.create(createOrgDto, organizationId);
  }

  @Get()
  findAll(@CurrentOrg() organizationId: string) {
    return this.organizationsService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentOrg() organizationId: string) {
    // Validar que el ID de la organización coincida con la organización del JWT
    if (id !== organizationId) {
      throw new Error('No tienes acceso a esta organización');
    }
    return this.organizationsService.findOne(id);
  }

  @Delete(':id')
  @OrgRoles('OWNER')
  remove(@Param('id') id: string, @CurrentOrg() organizationId: string) {
    // Validar que el ID de la organización coincida con la organización del JWT
    if (id !== organizationId) {
      throw new Error('No puedes eliminar una organización que no te pertenece');
    }
    return this.organizationsService.remove(id);
  }
}
