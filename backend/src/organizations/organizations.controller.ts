<<<<<<< HEAD
import { BadRequestException, Controller, ForbiddenException, Get, Post, Body, Param, Delete, Patch, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlatformRole } from '@prisma/client';
import { IsArray, IsEmail, IsObject, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { OrganizationsService } from './organizations.service';
=======
import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, ForbiddenException, UseInterceptors } from '@nestjs/common';
import { OrganizationsService, BusinessSettingsDto } from './organizations.service';
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { OrgRoles, PlatformRoles } from '../auth/decorators/org-roles.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
<<<<<<< HEAD
import { YapeQrService } from './yape-qr.service';
=======
import { Reflector } from '@nestjs/core';
import { AuditLogInterceptor, AuditAction, AuditEntityType } from '../audit-log/audit-log.interceptor';
import { AuditActionType } from '@prisma/client';
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540

export interface CreateOrganizationDto {
  name: string;
  businessTypeId: string;
  settings?: Record<string, any>;
}

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}

export class CreatePlatformOrganizationDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsUUID()
  businessTypeId!: string;

  @IsEmail()
  ownerEmail!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  enabledModules?: string[];

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}

export class UpdatePlatformOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsUUID()
  businessTypeId?: string;

  @IsOptional()
  @IsEmail()
  ownerEmail?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  enabledModules?: string[];

  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
    private readonly yapeQrService: YapeQrService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createOrgDto: CreateOrganizationDto,
    @CurrentUser() user: { sub: string; platformRole?: PlatformRole },
  ) {
    if (user.platformRole) {
      throw new ForbiddenException('Platform accounts cannot own business organizations');
    }
    return this.organizationsService.create(createOrgDto, user.sub);
  }

  @Get('platform/all')
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles(PlatformRole.PLATFORM_ADMIN)
  findAllForPlatform() {
    return this.organizationsService.findAllForPlatform();
  }

  @Post('platform')
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles(PlatformRole.PLATFORM_ADMIN)
  createForPlatform(@Body() dto: CreatePlatformOrganizationDto) {
    return this.organizationsService.createForPlatform(dto);
  }

  @Patch('platform/:id')
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles(PlatformRole.PLATFORM_ADMIN)
  updateForPlatform(@Param('id') id: string, @Body() dto: UpdatePlatformOrganizationDto) {
    return this.organizationsService.updateForPlatform(id, dto);
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

<<<<<<< HEAD
  @Post(':id/yape-qr')
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles('OWNER', 'ADMIN')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      callback(null, ['image/png', 'image/jpeg'].includes(file.mimetype));
    },
  }))
  uploadYapeQr(
    @Param('id') id: string,
    @CurrentOrg() organizationId: string,
    @UploadedFile() file: { buffer: Buffer } | undefined,
  ) {
    if (id !== organizationId) throw new ForbiddenException('No puedes cambiar la configuración de otra organización');
    if (!file) throw new BadRequestException('Selecciona una imagen PNG o JPG de hasta 2 MB');
    return this.yapeQrService.save(organizationId, file.buffer);
=======
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
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540
  }

  @Patch(':id')
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles('OWNER', 'ADMIN')
  update(
    @Param('id') id: string,
    @Body() updateOrgDto: UpdateOrganizationDto,
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
