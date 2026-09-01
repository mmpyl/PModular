import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { CurrentOrg } from '../auth/decorators/org-roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales/daily')
  async getDailySalesReport(
    @CurrentOrg() orgId: string,
    @Query('date') dateStr?: string,
  ) {
    const date = dateStr ? new Date(dateStr) : new Date();
    
    return this.reportsService.getDailySalesReport(orgId, date);
  }

  @Get('products/top')
  async getTopProductsReport(
    @CurrentOrg() orgId: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
    @Query('limit') limit?: number,
  ) {
    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    startDate.setDate(startDate.getDate() - 30); // Default: últimos 30 días
    
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    
    return this.reportsService.getTopProductsReport(
      orgId,
      startDate,
      endDate,
      limit ? parseInt(limit.toString(), 10) : 20,
    );
  }

  @Get('inventory/turnover')
  async getInventoryTurnoverReport(
    @CurrentOrg() orgId: string,
    @Query('days') days?: number,
  ) {
    return this.reportsService.getInventoryTurnoverReport(
      orgId,
      days ? parseInt(days.toString(), 10) : 30,
    );
  }

  @Get('inventory/expiring')
  async getExpiringStockReport(
    @CurrentOrg() orgId: string,
    @Query('daysThreshold') daysThreshold?: number,
  ) {
    return this.reportsService.getExpiringStockReport(
      orgId,
      daysThreshold ? parseInt(daysThreshold.toString(), 10) : 30,
    );
  }

  @Get('purchases/suppliers')
  async getSupplierPurchasesReport(
    @CurrentOrg() orgId: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    
    return this.reportsService.getSupplierPurchasesReport(
      orgId,
      startDate,
      endDate,
    );
  }

  @Get('cashflow')
  async getCashFlowReport(
    @CurrentOrg() orgId: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    
    return this.reportsService.getCashFlowReport(
      orgId,
      startDate,
      endDate,
    );
  }

  @Get('dashboard/summary')
  async getDashboardSummary(@CurrentOrg() orgId: string) {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Ejecutar reportes en paralelo para el dashboard
    const [dailySales, topProducts, expiringStock, supplierPurchases] = await Promise.all([
      this.reportsService.getDailySalesReport(orgId, today),
      this.reportsService.getTopProductsReport(orgId, thirtyDaysAgo, today, 5),
      this.reportsService.getExpiringStockReport(orgId, 30),
      this.reportsService.getSupplierPurchasesReport(orgId, thirtyDaysAgo, today),
    ]);

    return {
      ventasHoy: dailySales.totalVentas,
      ticketPromedio: dailySales.ticketPromedio,
      itemsVendidos: dailySales.totalItems,
      productosPorVencer: expiringStock.batches.length,
      valorPorVencer: expiringStock.totalValue,
      topProductos: topProducts.products.slice(0, 5),
      totalComprasMes: supplierPurchases.totalSpent,
      proveedoresActivos: supplierPurchases.suppliers.length,
    };
  }
}
