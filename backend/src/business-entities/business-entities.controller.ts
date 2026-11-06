import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BusinessEntitiesService } from './business-entities.service';
import { CreateBusinessEntityDto, UpdateBusinessEntityDto, EntityType } from './dto/create-business-entity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { RequiredModules } from '../auth/decorators/required-modules.decorator';
import { ModuleAccessGuard } from '../auth/guards/module-access.guard';

@Controller('business-entities')
<<<<<<< HEAD
@UseGuards(JwtAuthGuard, TenantGuard, ModuleAccessGuard)
@RequiredModules('ventas', 'compras')
=======
@UseGuards(JwtAuthGuard, TenantGuard, OrgRolesGuard)
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540
export class BusinessEntitiesController {
  constructor(private readonly businessEntitiesService: BusinessEntitiesService) {}
  
  @Post()
  @OrgRoles('OWNER', 'ADMIN')
  create(@Body() dto: CreateBusinessEntityDto, @CurrentOrg() orgId: string) {
    return this.businessEntitiesService.create(orgId, dto);
  }
  
  @Get()
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR', 'INVENTARIO')
  findAll(
    @CurrentOrg() orgId: string,
    @Query('type') entityType?: EntityType,
    @Query('search') search?: string,
  ) {
    return this.businessEntitiesService.findAll(orgId, entityType, search);
  }
  
  @Get(':id')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR', 'INVENTARIO')
  findOne(@Param('id') id: string, @CurrentOrg() orgId: string) {
    return this.businessEntitiesService.findOne(orgId, id);
  }

  /**
   * Fase 5: Obtiene entidad con historial de transacciones y saldo
   */
  @Get(':id/history')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR')
  findOneWithHistory(@Param('id') id: string, @CurrentOrg() orgId: string) {
    return this.businessEntitiesService.findOneWithHistory(orgId, id);
  }

  /**
   * Fase 5: Recalcula el saldo basado en transacciones
   */
  @Post(':id/recalculate-balance')
  @OrgRoles('OWNER', 'ADMIN')
  recalculateBalance(@Param('id') id: string, @CurrentOrg() orgId: string) {
    return this.businessEntitiesService.recalculateBalance(orgId, id);
  }

  /**
   * Fase 5: Verifica límite de crédito
   */
  @Get(':id/check-credit-limit')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR')
  checkCreditLimit(@Param('id') id: string, @CurrentOrg() orgId: string) {
    return this.businessEntitiesService.checkCreditLimit(orgId, id);
  }
  
  @Patch(':id')
  @OrgRoles('OWNER', 'ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessEntityDto,
    @CurrentOrg() orgId: string,
  ) {
    return this.businessEntitiesService.update(orgId, id, dto);
  }
  
  @Delete(':id')
  @OrgRoles('OWNER', 'ADMIN')
  remove(@Param('id') id: string, @CurrentOrg() orgId: string) {
    return this.businessEntitiesService.remove(orgId, id);
  }
}
