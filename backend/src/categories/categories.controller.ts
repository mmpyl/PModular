import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';

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
    @Query('organizationId') organizationId: string,
  ) {
    return this.categoriesService.create(organizationId, createCategoryDto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.categoriesService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('organizationId') organizationId: string) {
    return this.categoriesService.findOne(organizationId, id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('organizationId') organizationId: string) {
    return this.categoriesService.remove(organizationId, id);
  }
}
