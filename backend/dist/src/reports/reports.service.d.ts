import { PrismaService } from '../prisma.service';
import { DateRangeDto, SalesSummaryDto, SalesByCategoryDto, TopProductDto, InventorySummaryDto, InventoryByCategoryDto, StockMovementSummaryDto, PurchaseSummaryDto, PurchasesBySupplierDto, CashRegisterSummaryDto, DashboardMetricsDto, ExpiringBatchesDto, LowStockDto } from './dto/reports.dto';
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    private getDateRange;
    getSalesSummary(organizationId: string, dto: DateRangeDto): Promise<SalesSummaryDto>;
    getSalesByCategory(organizationId: string, dto: DateRangeDto): Promise<SalesByCategoryDto[]>;
    getTopProducts(organizationId: string, dto: DateRangeDto, limit?: number): Promise<TopProductDto[]>;
    getInventorySummary(organizationId: string): Promise<InventorySummaryDto>;
    getInventoryByCategory(organizationId: string): Promise<InventoryByCategoryDto[]>;
    getStockMovementSummary(organizationId: string, dto: DateRangeDto): Promise<StockMovementSummaryDto>;
    getPurchaseSummary(organizationId: string, dto: DateRangeDto): Promise<PurchaseSummaryDto>;
    getPurchasesBySupplier(organizationId: string, dto: DateRangeDto): Promise<PurchasesBySupplierDto[]>;
    getCashRegisterSummary(organizationId: string, dto: DateRangeDto): Promise<CashRegisterSummaryDto>;
    getDashboardMetrics(organizationId: string): Promise<DashboardMetricsDto>;
    getExpiringBatches(organizationId: string, daysThreshold?: number): Promise<ExpiringBatchesDto[]>;
    getLowStockProducts(organizationId: string, threshold?: number): Promise<LowStockDto[]>;
}
