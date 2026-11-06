import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { RequiredModules } from '../auth/decorators/required-modules.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';

export interface CreateProductDto {
  name: string;
  sku?: string;
  description?: string;
  price: number;
  cost?: number;
  categoryId?: string;
  unitId?: string;
  attributes?: Record<string, any>;
  lowStockThreshold?: number;
  isActive?: boolean;
}

@Controller('products')
@UseGuards(JwtAuthGuard, TenantGuard, OrgRolesGuard, ModuleAccessGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  @RequiredModules('inventario')
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.productsService.create(organizationId, createProductDto);
  }

  @Get()
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR')
  @RequiredModules('inventario', 'ventas', 'compras')
  findAll(
    @CurrentOrg() organizationId: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.productsService.findAll(organizationId, { categoryId, search });
  }

  @Get(':id')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR')
  @RequiredModules('inventario', 'ventas', 'compras')
  findOne(@Param('id') id: string, @CurrentOrg() organizationId: string) {
    return this.productsService.findOne(organizationId, id);
  }

  @Patch(':id')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  @RequiredModules('inventario')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: Partial<CreateProductDto>,
    @CurrentOrg() organizationId: string,
  ) {
    return this.productsService.update(organizationId, id, updateProductDto);
  }

  @Delete(':id')
  @OrgRoles('OWNER', 'ADMIN')
  @RequiredModules('inventario')
  remove(@Param('id') id: string, @CurrentOrg() organizationId: string) {
    return this.productsService.remove(organizationId, id);
  }
}
