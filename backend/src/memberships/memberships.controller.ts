import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrgRole } from '@prisma/client';

export interface CreateMembershipDto {
  userId: string;
  organizationId: string;
  role?: OrgRole;
}

@Controller('memberships')
@UseGuards(JwtAuthGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post()
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles('OWNER')
  create(@Body() createMembershipDto: CreateMembershipDto, @CurrentOrg() organizationId: string) {
    // Validar que la organización del DTO coincida con la del JWT
    if (createMembershipDto.organizationId !== organizationId) {
      throw new ForbiddenException('No puedes crear membresías para otra organización');
    }
    return this.membershipsService.create(createMembershipDto);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string, @CurrentUser() user: { sub: string; platformRole?: string }) {
    // Regla de acceso: permitido si userId === request.user.sub o request.user.platformRole existe
    if (userId !== user.sub && !user.platformRole) {
      throw new ForbiddenException('No tienes acceso a las membresías de otro usuario');
    }
    return this.membershipsService.findByUser(userId);
  }

  @Get('organization/:organizationId')
  @UseGuards(TenantGuard, OrgRolesGuard)
  findByOrganization(@Param('organizationId') organizationId: string, @CurrentOrg() currentOrgId: string) {
    // Validar que solo se pueda ver miembros de tu propia organización
    if (organizationId !== currentOrgId) {
      throw new ForbiddenException('No tienes acceso a los miembros de esta organización');
    }
    return this.membershipsService.findByOrganization(organizationId);
  }

  @Get('member/:userId/:organizationId')
  @UseGuards(TenantGuard, OrgRolesGuard)
  findOne(@Param('userId') userId: string, @Param('organizationId') organizationId: string, @CurrentOrg() currentOrgId: string) {
    // Validar que solo se pueda ver miembros de tu propia organización
    if (organizationId !== currentOrgId) {
      throw new ForbiddenException('No tienes acceso a este miembro');
    }
    return this.membershipsService.findOne(userId, organizationId);
  }

  @Delete(':userId/:organizationId')
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles('OWNER')
  remove(
    @Param('userId') userId: string,
    @Param('organizationId') organizationId: string,
    @CurrentOrg() currentOrgId: string
  ) {
    // Validar que la organización coincida con la del JWT
    if (organizationId !== currentOrgId) {
      throw new ForbiddenException('No puedes eliminar membresías de otra organización');
    }
    return this.membershipsService.remove(userId, organizationId);
  }
}
