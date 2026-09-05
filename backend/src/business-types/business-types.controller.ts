import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { BusinessTypesService } from './business-types.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformRoles } from '../auth/decorators/org-roles.decorator';
import { PlatformRole } from '@prisma/client';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';

@Controller('business-types')
@UseGuards(JwtAuthGuard)
export class BusinessTypesController {
  constructor(private readonly businessTypesService: BusinessTypesService) {}

  @Post('seed')
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles(PlatformRole.PLATFORM_ADMIN)
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
