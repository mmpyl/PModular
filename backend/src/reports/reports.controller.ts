import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { DateRangeDto } from './dto/reports.dto';
import { Request } from 'express';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, TenantGuard, OrgRolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Resumen de ventas - Solo OWNER/ADMIN
   */
  @Get('sales/summary')
  @OrgRoles('OWNER', 'ADMIN')
  async getSalesSummary(
    @CurrentOrg() organizationId: string,
    @Query() query: DateRangeDto,
  ) {
    return this.reportsService.getSalesSummary(organizationId, query);
  }

  /**
   * Ventas por categoría - Solo OWNER/ADMIN
   */
  @Get('sales/by-category')
  @OrgRoles('OWNER', 'ADMIN')
  async getSalesByCategory(
    @CurrentOrg() organizationId: string,
    @Query() query: DateRangeDto,
  ) {
    return this.reportsService.getSalesByCategory(organizationId, query);
  }

  /**
   * Top productos más vendidos - Solo OWNER/ADMIN
   */
  @Get('sales/top-products')
  @OrgRoles('OWNER', 'ADMIN')
  async getTopProducts(
    @CurrentOrg() organizationId: string,
    @Query() query: DateRangeDto,
    @Query('limit') limit?: number,
  ) {
    return this.reportsService.getTopProducts(
      organizationId,
      query,
      limit ? parseInt(limit.toString(), 10) : 10,
    );
  }

  /**
   * Resumen de inventario - OWNER/ADMIN/INVENTARIO
   */
  @Get('inventory/summary')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async getInventorySummary(@CurrentOrg() organizationId: string) {
    return this.reportsService.getInventorySummary(organizationId);
  }

  /**
   * Inventario por categoría - OWNER/ADMIN/INVENTARIO
   */
  @Get('inventory/by-category')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async getInventoryByCategory(@CurrentOrg() organizationId: string) {
    return this.reportsService.getInventoryByCategory(organizationId);
  }

  /**
   * Resumen de movimientos de stock - OWNER/ADMIN/INVENTARIO
   */
  @Get('stock-movements/summary')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async getStockMovementSummary(
    @CurrentOrg() organizationId: string,
    @Query() query: DateRangeDto,
  ) {
    return this.reportsService.getStockMovementSummary(organizationId, query);
  }

  /**
   * Resumen de compras - OWNER/ADMIN/INVENTARIO
   */
  @Get('purchases/summary')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async getPurchaseSummary(
    @CurrentOrg() organizationId: string,
    @Query() query: DateRangeDto,
  ) {
    return this.reportsService.getPurchaseSummary(organizationId, query);
  }

  /**
   * Compras por proveedor - OWNER/ADMIN/INVENTARIO
   */
  @Get('purchases/by-supplier')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async getPurchasesBySupplier(
    @CurrentOrg() organizationId: string,
    @Query() query: DateRangeDto,
  ) {
    return this.reportsService.getPurchasesBySupplier(organizationId, query);
  }

  /**
   * Resumen de caja - OWNER/ADMIN
   */
  @Get('cash-register/summary')
  @OrgRoles('OWNER', 'ADMIN')
  async getCashRegisterSummary(
    @CurrentOrg() organizationId: string,
    @Query() query: DateRangeDto,
  ) {
    return this.reportsService.getCashRegisterSummary(organizationId, query);
  }

  /**
   * Métricas principales para dashboard - OWNER/ADMIN/VENDEDOR
   */
  @Get('dashboard/metrics')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR')
  async getDashboardMetrics(@CurrentOrg() organizationId: string) {
    return this.reportsService.getDashboardMetrics(organizationId);
  }

  /**
   * Lotes próximos a vencer - OWNER/ADMIN/INVENTARIO
   */
  @Get('inventory/expiring-batches')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async getExpiringBatches(
    @CurrentOrg() organizationId: string,
    @Query('daysThreshold') daysThreshold?: number,
  ) {
    return this.reportsService.getExpiringBatches(
      organizationId,
      daysThreshold ? parseInt(daysThreshold.toString(), 10) : 30,
    );
  }

  /**
   * Productos con stock bajo - OWNER/ADMIN/INVENTARIO
   */
  @Get('inventory/low-stock')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async getLowStockProducts(
    @CurrentOrg() organizationId: string,
    @Query('threshold') threshold?: number,
  ) {
    return this.reportsService.getLowStockProducts(
      organizationId,
      threshold ? parseInt(threshold.toString(), 10) : 10,
    );
  }
}
