import { PrismaService } from '../prisma.service';
import { DateRangeDto, SalesSummaryDto, SalesByCategoryDto, TopProductDto, InventorySummaryDto, InventoryByCategoryDto, StockMovementSummaryDto, PurchaseSummaryDto, PurchasesBySupplierDto, CashRegisterSummaryDto, DashboardMetricsDto, ExpiringBatchesDto, LowStockDto, PeriodComparisonDto, ActivityMetricsDto } from './dto/reports.dto';
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    private getDateRange;
    getSalesSummary(organizationId: string, dto: DateRangeDto): Promise<SalesSummaryDto>;
    getSalesByCategory(organizationId: string, dto: DateRangeDto): Promise<SalesByCategoryDto[]>;
    getTopProducts(organizationId: string, dto: DateRangeDto, limit?: number): Promise<TopProductDto[]>;
    getInventorySummary(organizationId: string, dto?: DateRangeDto): Promise<InventorySummaryDto>;
    getInventoryByCategory(organizationId: string, dto?: DateRangeDto): Promise<InventoryByCategoryDto[]>;
    getStockMovementSummary(organizationId: string, dto: DateRangeDto): Promise<StockMovementSummaryDto>;
    getPurchaseSummary(organizationId: string, dto: DateRangeDto): Promise<PurchaseSummaryDto>;
    getPurchasesBySupplier(organizationId: string, dto: DateRangeDto): Promise<PurchasesBySupplierDto[]>;
    getCashRegisterSummary(organizationId: string, dto: DateRangeDto): Promise<CashRegisterSummaryDto>;
    getDashboardMetrics(organizationId: string): Promise<DashboardMetricsDto>;
    getExpiringBatches(organizationId: string, daysThreshold?: number): Promise<ExpiringBatchesDto[]>;
    getLowStockProducts(organizationId: string, _threshold?: number): Promise<LowStockDto[]>;
    exportToCSV<T>(data: T[], fields?: string[]): Buffer;
    exportToExcel<T>(data: T[], sheetName: string | undefined, columns: {
        header: string;
        key: string;
    }[]): Promise<Buffer>;
    getSalesComparison(organizationId: string, currentPeriod: {
        startDate: Date;
        endDate: Date;
    }, previousPeriod: {
        startDate: Date;
        endDate: Date;
    }): Promise<PeriodComparisonDto>;
    getActivityMetrics(organizationId: string, dto: DateRangeDto): Promise<ActivityMetricsDto>;
    getMonthOverMonthComparison(organizationId: string, referenceDate?: Date): Promise<PeriodComparisonDto>;
}
