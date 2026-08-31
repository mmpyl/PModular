import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { BusinessTypesService } from './business-types.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('business-types')
@UseGuards(JwtAuthGuard)
export class BusinessTypesController {
  constructor(private readonly businessTypesService: BusinessTypesService) {}

  @Post('seed')
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
