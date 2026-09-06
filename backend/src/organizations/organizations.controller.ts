import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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
      throw new Error('No tienes acceso a esta organización');
    }
    return this.organizationsService.findOne(id);
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
      throw new Error('No puedes editar otra organización');
    }
    return this.organizationsService.update(id, updateOrgDto);
  }

  @Delete(':id')
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles('OWNER')
  remove(@Param('id') id: string, @CurrentOrg() organizationId: string) {
    // Validar que el ID de la organización coincida con la organización del JWT
    if (id !== organizationId) {
      throw new Error('No puedes eliminar una organización que no te pertenece');
    }
    return this.organizationsService.remove(id);
  }
}
