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

@Controller('reports')
@UseGuards(TenantGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Resumen de ventas
   */
  @Get('sales/summary')
  async getSalesSummary(
    @Req() req: Request,
    @Query() query: DateRangeDto,
  ) {
    const organizationId = req.headers['x-organization-id'] as string;
    return this.reportsService.getSalesSummary(organizationId, query);
  }

  /**
   * Ventas por categoría
   */
  @Get('sales/by-category')
  async getSalesByCategory(
    @Req() req: Request,
    @Query() query: DateRangeDto,
  ) {
    const organizationId = req.headers['x-organization-id'] as string;
    return this.reportsService.getSalesByCategory(organizationId, query);
  }

  /**
   * Top productos más vendidos
   */
  @Get('sales/top-products')
  async getTopProducts(
    @Req() req: Request,
    @Query() query: DateRangeDto,
    @Query('limit') limit?: number,
  ) {
    const organizationId = req.headers['x-organization-id'] as string;
    return this.reportsService.getTopProducts(
      organizationId,
      query,
      limit ? parseInt(limit.toString(), 10) : 10,
    );
  }

  /**
   * Resumen de inventario
   */
  @Get('inventory/summary')
  async getInventorySummary(@Req() req: Request) {
    const organizationId = req.headers['x-organization-id'] as string;
    return this.reportsService.getInventorySummary(organizationId);
  }

  /**
   * Inventario por categoría
   */
  @Get('inventory/by-category')
  async getInventoryByCategory(@Req() req: Request) {
    const organizationId = req.headers['x-organization-id'] as string;
    return this.reportsService.getInventoryByCategory(organizationId);
  }

  /**
   * Resumen de movimientos de stock
   */
  @Get('stock-movements/summary')
  async getStockMovementSummary(
    @Req() req: Request,
    @Query() query: DateRangeDto,
  ) {
    const organizationId = req.headers['x-organization-id'] as string;
    return this.reportsService.getStockMovementSummary(organizationId, query);
  }

  /**
   * Resumen de compras
   */
  @Get('purchases/summary')
  async getPurchaseSummary(
    @Req() req: Request,
    @Query() query: DateRangeDto,
  ) {
    const organizationId = req.headers['x-organization-id'] as string;
    return this.reportsService.getPurchaseSummary(organizationId, query);
  }

  /**
   * Compras por proveedor
   */
  @Get('purchases/by-supplier')
  async getPurchasesBySupplier(
    @Req() req: Request,
    @Query() query: DateRangeDto,
  ) {
    const organizationId = req.headers['x-organization-id'] as string;
    return this.reportsService.getPurchasesBySupplier(organizationId, query);
  }

  /**
   * Resumen de caja
   */
  @Get('cash-register/summary')
  async getCashRegisterSummary(
    @Req() req: Request,
    @Query() query: DateRangeDto,
  ) {
    const organizationId = req.headers['x-organization-id'] as string;
    return this.reportsService.getCashRegisterSummary(organizationId, query);
  }

  /**
   * Métricas principales para dashboard
   */
  @Get('dashboard/metrics')
  async getDashboardMetrics(@Req() req: Request) {
    const organizationId = req.headers['x-organization-id'] as string;
    return this.reportsService.getDashboardMetrics(organizationId);
  }

  /**
   * Lotes próximos a vencer
   */
  @Get('inventory/expiring-batches')
  async getExpiringBatches(
    @Req() req: Request,
    @Query('daysThreshold') daysThreshold?: number,
  ) {
    const organizationId = req.headers['x-organization-id'] as string;
    return this.reportsService.getExpiringBatches(
      organizationId,
      daysThreshold ? parseInt(daysThreshold.toString(), 10) : 30,
    );
  }

  /**
   * Productos con stock bajo
   */
  @Get('inventory/low-stock')
  async getLowStockProducts(
    @Req() req: Request,
    @Query('threshold') threshold?: number,
  ) {
    const organizationId = req.headers['x-organization-id'] as string;
    return this.reportsService.getLowStockProducts(
      organizationId,
      threshold ? parseInt(threshold.toString(), 10) : 10,
    );
  }
}
