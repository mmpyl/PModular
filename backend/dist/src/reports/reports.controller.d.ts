import { ReportsService } from './reports.service';
import { DateRangeDto } from './dto/reports.dto';
import { Response } from 'express';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getSalesSummary(organizationId: string, query: DateRangeDto): Promise<import("./dto/reports.dto").SalesSummaryDto>;
    getSalesByCategory(organizationId: string, query: DateRangeDto): Promise<import("./dto/reports.dto").SalesByCategoryDto[]>;
    getTopProducts(organizationId: string, query: DateRangeDto, limit?: number): Promise<import("./dto/reports.dto").TopProductDto[]>;
    getInventorySummary(organizationId: string): Promise<import("./dto/reports.dto").InventorySummaryDto>;
    getInventoryByCategory(organizationId: string): Promise<import("./dto/reports.dto").InventoryByCategoryDto[]>;
    getStockMovementSummary(organizationId: string, query: DateRangeDto): Promise<import("./dto/reports.dto").StockMovementSummaryDto>;
    getPurchaseSummary(organizationId: string, query: DateRangeDto): Promise<import("./dto/reports.dto").PurchaseSummaryDto>;
    getPurchasesBySupplier(organizationId: string, query: DateRangeDto): Promise<import("./dto/reports.dto").PurchasesBySupplierDto[]>;
    getCashRegisterSummary(organizationId: string, query: DateRangeDto): Promise<import("./dto/reports.dto").CashRegisterSummaryDto>;
    getDashboardMetrics(organizationId: string): Promise<import("./dto/reports.dto").DashboardMetricsDto>;
    getExpiringBatches(organizationId: string, daysThreshold?: number): Promise<import("./dto/reports.dto").ExpiringBatchesDto[]>;
    getLowStockProducts(organizationId: string, threshold?: number): Promise<import("./dto/reports.dto").LowStockDto[]>;
    getMonthOverMonthComparison(organizationId: string, referenceDate?: string): Promise<import("./dto/reports.dto").PeriodComparisonDto>;
    getSalesComparison(organizationId: string, currentStart: string, currentEnd: string, previousStart: string, previousEnd: string): Promise<import("./dto/reports.dto").PeriodComparisonDto>;
    getActivityMetrics(organizationId: string, query: DateRangeDto): Promise<import("./dto/reports.dto").ActivityMetricsDto>;
    exportSalesToCsv(organizationId: string, query: DateRangeDto, res: Response): Promise<void>;
    exportTopProductsToCsv(organizationId: string, query: DateRangeDto, res: Response, limit?: number): Promise<void>;
    exportPurchasesBySupplierToCsv(organizationId: string, query: DateRangeDto, res: Response): Promise<void>;
    exportInventoryByCategoryToCsv(organizationId: string, res: Response): Promise<void>;
}
