import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch, ForbiddenException } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { OrgRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export interface CreateMembershipDto {
  userId: string;
  organizationId: string;
  role?: OrgRole;
}

export class AddTeamMemberDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsEnum(OrgRole)
  role?: OrgRole;
}

export class UpdateTeamMemberRoleDto {
  @IsEnum(OrgRole)
  role!: OrgRole;
}

@Controller('memberships')
@UseGuards(JwtAuthGuard, TenantGuard, OrgRolesGuard)
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

  @Post('team')
  @OrgRoles('OWNER')
  addTeamMember(@Body() dto: AddTeamMemberDto, @CurrentOrg() organizationId: string) {
    return this.membershipsService.addOrganizationMember({ ...dto, organizationId });
  }

  @Patch(':userId/:organizationId/role')
  @OrgRoles('OWNER')
  updateRole(
    @Param('userId') userId: string,
    @Param('organizationId') organizationId: string,
    @Body() dto: UpdateTeamMemberRoleDto,
    @CurrentOrg() currentOrgId: string,
  ) {
    if (organizationId !== currentOrgId) throw new ForbiddenException('No puedes cambiar roles de otro negocio');
    return this.membershipsService.updateRole(userId, organizationId, dto.role);
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

  @Get('member/:userId/:organizationId')
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
