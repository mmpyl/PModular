import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { UnitsOfMeasureService } from './units-of-measure.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';

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
    @CurrentOrg() organizationId: string,
  ) {
    return this.unitsOfMeasureService.create(organizationId, createUnitDto);
  }

  @Get()
  findAll(@CurrentOrg() organizationId: string) {
    return this.unitsOfMeasureService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentOrg() organizationId: string) {
    return this.unitsOfMeasureService.findOne(organizationId, id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentOrg() organizationId: string) {
    return this.unitsOfMeasureService.remove(organizationId, id);
  }
}
