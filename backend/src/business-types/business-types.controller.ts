import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { BusinessTypesService } from './business-types.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformRoles } from '../auth/decorators/org-roles.decorator';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';

/**
 * Roles de plataforma permitidos para operaciones de seed de tipos de negocio.
 * Centralizado para evitar hardcoding y facilitar cambios futuros.
 */
const ALLOWED_PLATFORM_ADMIN_ROLE = ['PLATFORM_ADMIN'] as const;

@Controller('business-types')
@UseGuards(JwtAuthGuard)
export class BusinessTypesController {
  constructor(private readonly businessTypesService: BusinessTypesService) {}

  @Post('seed')
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles(...ALLOWED_PLATFORM_ADMIN_ROLE)
  async seed() {
    return this.businessTypesService.seed();
  }

  @Get()
  findAll() {
    return this.businessTypesService.findAll();
  }

  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.businessTypesService.findOne(code);
  }
}
