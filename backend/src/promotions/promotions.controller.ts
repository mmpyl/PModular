import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import {
  CalculatePricingDto,
  CreatePromotionDto,
  UpdatePromotionDto,
} from './dto/promotion.dto';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * FASE B3: Promociones y precios por volumen.
 *
 * Permite definir combos, 2x1/NxM, descuentos por cantidad y precios
 * escalonados que el motor de ventas aplica automáticamente (reemplazando
 * el descuento manual por línea como única opción).
 */
@Controller('promotions')
@UseGuards(JwtAuthGuard, TenantGuard, OrgRolesGuard)
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @OrgRoles('OWNER', 'ADMIN')
  create(@CurrentOrg() orgId: string, @Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(orgId, dto);
  }

  @Get()
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR', 'CAJA')
  findAll(
    @CurrentOrg() orgId: string,
    @Query('active') active?: string,
    @Query('type') type?: string,
    @Query('productId') productId?: string,
  ) {
    return this.promotionsService.findAll(orgId, {
      active: active === undefined ? undefined : active === 'true',
      type,
      productId,
    });
  }

  /** Vista previa de pricing para el POS (aplica promos vigentes al carrito). */
  @Post('calculate')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR', 'CAJA')
  calculate(@CurrentOrg() orgId: string, @Body() dto: CalculatePricingDto) {
    return this.promotionsService.previewPricing(orgId, dto);
  }

  @Get(':id')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR', 'CAJA')
  findOne(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.promotionsService.findOne(orgId, id);
  }

  @Patch(':id')
  @OrgRoles('OWNER', 'ADMIN')
  update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.promotionsService.update(orgId, id, dto);
  }

  @Delete(':id')
  @OrgRoles('OWNER', 'ADMIN')
  deactivate(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.promotionsService.deactivate(orgId, id);
  }
}
