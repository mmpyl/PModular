import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';

export interface CreateCategoryDto {
  name: string;
  parentId?: string;
}

@Controller('categories')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.categoriesService.create(organizationId, createCategoryDto);
  }

  @Get()
  findAll(@CurrentOrg() organizationId: string) {
    return this.categoriesService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentOrg() organizationId: string) {
    return this.categoriesService.findOne(organizationId, id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentOrg() organizationId: string) {
    return this.categoriesService.remove(organizationId, id);
  }
}
