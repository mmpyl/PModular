import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { UnitsOfMeasureService } from './units-of-measure.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';

export interface CreateUnitOfMeasureDto {
  name: string;
  symbol?: string;
  isFractionable?: boolean;
}

@Controller('units-of-measure')
@UseGuards(JwtAuthGuard, TenantGuard)
export class UnitsOfMeasureController {
  constructor(private readonly unitsOfMeasureService: UnitsOfMeasureService) {}

  @Post()
  create(
    @Body() createUnitDto: CreateUnitOfMeasureDto,
    @Query('organizationId') organizationId: string,
  ) {
    return this.unitsOfMeasureService.create(organizationId, createUnitDto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.unitsOfMeasureService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('organizationId') organizationId: string) {
    return this.unitsOfMeasureService.findOne(organizationId, id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('organizationId') organizationId: string) {
    return this.unitsOfMeasureService.remove(organizationId, id);
  }
}
