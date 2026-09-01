import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';

export interface CreateProductDto {
  name: string;
  sku?: string;
  description?: string;
  price: number;
  cost?: number;
  categoryId?: string;
  unitId?: string;
  attributes?: Record<string, any>;
  isActive?: boolean;
}

@Controller('products')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.productsService.create(organizationId, createProductDto);
  }

  @Get()
  findAll(
    @CurrentOrg() organizationId: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.productsService.findAll(organizationId, { categoryId, search });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentOrg() organizationId: string) {
    return this.productsService.findOne(organizationId, id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentOrg() organizationId: string) {
    return this.productsService.remove(organizationId, id);
  }
}
