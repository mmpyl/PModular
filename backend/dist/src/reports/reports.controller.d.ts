import { ReportsService } from './reports.service';
import { DateRangeDto } from './dto/reports.dto';
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
}
