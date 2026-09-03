import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { OrgRole } from '@prisma/client';

export interface CreateMembershipDto {
  userId: string;
  organizationId: string;
  role?: OrgRole;
}

@Controller('memberships')
@UseGuards(JwtAuthGuard, TenantGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post()
  @OrgRoles('OWNER')
  create(@Body() createMembershipDto: CreateMembershipDto, @CurrentOrg() organizationId: string) {
    // Validar que la organización del DTO coincida con la del JWT
    if (createMembershipDto.organizationId !== organizationId) {
      throw new Error('No puedes crear membresías para otra organización');
    }
    return this.membershipsService.create(createMembershipDto);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.membershipsService.findByUser(userId);
  }

  @Get('organization/:organizationId')
  findByOrganization(@Param('organizationId') organizationId: string, @CurrentOrg() currentOrgId: string) {
    // Validar que solo se pueda ver miembros de tu propia organización
    if (organizationId !== currentOrgId) {
      throw new Error('No tienes acceso a los miembros de esta organización');
    }
    return this.membershipsService.findByOrganization(organizationId);
  }

  @Get(':userId/:organizationId')
  findOne(@Param('userId') userId: string, @Param('organizationId') organizationId: string, @CurrentOrg() currentOrgId: string) {
    // Validar que solo se pueda ver miembros de tu propia organización
    if (organizationId !== currentOrgId) {
      throw new Error('No tienes acceso a este miembro');
    }
    return this.membershipsService.findOne(userId, organizationId);
  }

  @Delete(':userId/:organizationId')
  @OrgRoles('OWNER')
  remove(
    @Param('userId') userId: string,
    @Param('organizationId') organizationId: string,
    @CurrentOrg() currentOrgId: string
  ) {
    // Validar que la organización coincida con la del JWT
    if (organizationId !== currentOrgId) {
      throw new Error('No puedes eliminar membresías de otra organización');
    }
    return this.membershipsService.remove(userId, organizationId);
  }
}
