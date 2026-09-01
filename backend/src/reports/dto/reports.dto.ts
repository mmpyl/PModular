export interface DateRangeDto {
  startDate?: string; // ISO 8601 format: YYYY-MM-DD
  endDate?: string;   // ISO 8601 format: YYYY-MM-DD
}

export interface SalesSummaryDto {
  totalSales: number;
  totalRevenue: number;
  totalTax: number;
  totalDiscount: number;
  averageTicket: number;
  salesCount: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
}

export interface SalesByCategoryDto {
  categoryId: string;
  categoryName: string;
  totalQuantity: number;
  totalRevenue: number;
  percentage: number;
}

export interface TopProductDto {
  productId: string;
  productName: string;
  sku?: string | null;
  totalQuantity: number;
  totalRevenue: number;
  rank: number;
}

export interface InventorySummaryDto {
  totalProducts: number;
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiringSoonItems: number;
}

export interface InventoryByCategoryDto {
  categoryId: string;
  categoryName: string;
  productCount: number;
  totalQuantity: number;
  totalValue: number;
}

export interface StockMovementSummaryDto {
  totalIngresses: number;
  totalExits: number;
  netBalance: number;
  movementsByReason: MovementsByReasonDto[];
  period: {
    startDate: Date;
    endDate: Date;
  };
}

export interface MovementsByReasonDto {
  reason: string;
  count: number;
  totalQuantity: number;
}

export interface PurchaseSummaryDto {
  totalPurchases: number;
  totalSpent: number;
  totalTax: number;
  averageOrderValue: number;
  purchaseCount: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
}

export interface PurchasesBySupplierDto {
  supplierId: string;
  supplierName: string;
  totalOrders: number;
  totalSpent: number;
  percentage: number;
}

export interface CashRegisterSummaryDto {
  totalOpenings: number;
  totalClosings: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  discrepancies: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
}

export interface DashboardMetricsDto {
  sales: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    growth: number; // porcentaje de crecimiento
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    growth: number;
  };
  inventory: {
    totalValue: number;
    lowStockAlerts: number;
    expiringAlerts: number;
  };
  customers: {
    total: number;
    activeThisMonth: number;
  };
  topProducts: TopProductDto[];
}

export interface ExpiringBatchesDto {
  batchId: string;
  productId: string;
  productName: string;
  batchNumber: string;
  expirationDate: Date;
  currentQuantity: number;
  daysUntilExpiration: number;
}

export interface LowStockDto {
  productId: string;
  productName: string;
  sku?: string | null;
  currentQuantity: number;
  unitName?: string;
  batches: {
    batchId: string;
    quantity: number;
    expirationDate?: Date;
  }[];
}
