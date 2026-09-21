import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Req,
  Res,
  Header,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { DateRangeDto } from './dto/reports.dto';
import { Request, Response } from 'express';
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

  /**
   * Comparativa mes vs mes anterior - OWNER/ADMIN
   */
  @Get('sales/month-over-month')
  @OrgRoles('OWNER', 'ADMIN')
  async getMonthOverMonthComparison(
    @CurrentOrg() organizationId: string,
    @Query('referenceDate') referenceDate?: string,
  ) {
    const refDate = referenceDate ? new Date(referenceDate) : undefined;
    return this.reportsService.getMonthOverMonthComparison(organizationId, refDate);
  }

  /**
   * Comparativa de ventas entre dos períodos - OWNER/ADMIN
   */
  @Get('sales/comparison')
  @OrgRoles('OWNER', 'ADMIN')
  async getSalesComparison(
    @CurrentOrg() organizationId: string,
    @Query('currentStart') currentStart: string,
    @Query('currentEnd') currentEnd: string,
    @Query('previousStart') previousStart: string,
    @Query('previousEnd') previousEnd: string,
  ) {
    return this.reportsService.getSalesComparison(
      organizationId,
      { startDate: new Date(currentStart), endDate: new Date(currentEnd) },
      { startDate: new Date(previousStart), endDate: new Date(previousEnd) },
    );
  }

  /**
   * Métricas de actividad basadas en AuditLog - OWNER/ADMIN
   */
  @Get('activity/metrics')
  @OrgRoles('OWNER', 'ADMIN')
  async getActivityMetrics(
    @CurrentOrg() organizationId: string,
    @Query() query: DateRangeDto,
  ) {
    return this.reportsService.getActivityMetrics(organizationId, query);
  }

  /**
   * Exportar reporte de ventas a CSV - OWNER/ADMIN
   */
  @Get('export/sales/csv')
  @OrgRoles('OWNER', 'ADMIN')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="sales_report.csv"')
  async exportSalesToCsv(
    @CurrentOrg() organizationId: string,
    @Query() query: DateRangeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const salesData = await this.reportsService.getSalesSummary(organizationId, query);
    const csvBuffer = this.reportsService.exportToCSV([salesData]);
    res.end(csvBuffer);
  }

  /**
   * Exportar top productos a CSV - OWNER/ADMIN
   */
  @Get('export/top-products/csv')
  @OrgRoles('OWNER', 'ADMIN')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="top_products.csv"')
  async exportTopProductsToCsv(
    @CurrentOrg() organizationId: string,
    @Query() query: DateRangeDto,
    @Res({ passthrough: true }) res: Response,
    @Query('limit') limit?: number,
  ) {
    const productsData = await this.reportsService.getTopProducts(
      organizationId,
      query,
      limit ? parseInt(limit.toString(), 10) : 10,
    );
    const csvBuffer = this.reportsService.exportToCSV(productsData);
    res.end(csvBuffer);
  }

  /**
   * Exportar compras por proveedor a CSV - OWNER/ADMIN/INVENTARIO
   */
  @Get('export/purchases-by-supplier/csv')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="purchases_by_supplier.csv"')
  async exportPurchasesBySupplierToCsv(
    @CurrentOrg() organizationId: string,
    @Query() query: DateRangeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const purchasesData = await this.reportsService.getPurchasesBySupplier(organizationId, query);
    const csvBuffer = this.reportsService.exportToCSV(purchasesData);
    res.end(csvBuffer);
  }

  /**
   * Exportar inventario por categoría a CSV - OWNER/ADMIN/INVENTARIO
   */
  @Get('export/inventory-by-category/csv')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="inventory_by_category.csv"')
  async exportInventoryByCategoryToCsv(
    @CurrentOrg() organizationId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const inventoryData = await this.reportsService.getInventoryByCategory(organizationId);
    const csvBuffer = this.reportsService.exportToCSV(inventoryData);
    res.end(csvBuffer);
  }
}
