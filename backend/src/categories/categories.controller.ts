import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { RequiredModules } from '../auth/decorators/required-modules.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';

export interface CreateCategoryDto {
  name: string;
  parentId?: string;
}

@Controller('categories')
@UseGuards(JwtAuthGuard, TenantGuard, OrgRolesGuard, ModuleAccessGuard)
@RequiredModules('inventario')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentOrg() organizationId: string,
  ) {
    return this.categoriesService.create(organizationId, createCategoryDto);
  }

  @Get()
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR')
  findAll(@CurrentOrg() organizationId: string) {
    return this.categoriesService.findAll(organizationId);
  }

  @Get(':id')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR')
  findOne(@Param('id') id: string, @CurrentOrg() organizationId: string) {
    return this.categoriesService.findOne(organizationId, id);
  }

  @Patch(':id')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: Partial<CreateCategoryDto>,
    @CurrentOrg() organizationId: string,
  ) {
    return this.categoriesService.update(organizationId, id, updateCategoryDto);
  }

  @Delete(':id')
  @OrgRoles('OWNER', 'ADMIN')
  remove(@Param('id') id: string, @CurrentOrg() organizationId: string) {
    return this.categoriesService.remove(organizationId, id);
  }
}
