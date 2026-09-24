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
  lowStockThreshold?: number;
  unitName?: string;
  batches: {
    batchId: string;
    quantity: number;
    expirationDate?: Date;
  }[];
}

export interface PeriodComparisonDto {
  currentPeriod: {
    startDate: Date;
    endDate: Date;
    totalRevenue: number;
    totalSales: number;
  };
  previousPeriod: {
    startDate: Date;
    endDate: Date;
    totalRevenue: number;
    totalSales: number;
  };
  growth: {
    revenueGrowth: number;
    salesGrowth: number;
  };
}

/**
 * FASE B6: Reportes de rotación (decisiones de compra)
 */
export interface RotationFiltersDto extends DateRangeDto {
  categoryId?: string; // filtra por categoría de producto
  limit?: number; // top N (por defecto 50)
}

export interface ProductRotationDto {
  productId: string;
  productName: string;
  sku?: string | null;
  barcode?: string | null;
  isFastSale?: boolean;
  categoryId?: string | null;
  categoryName?: string | null;
  unitsSold: number; // unidades vendidas en el período
  revenue: number; // ingresos en el período
  grossMargin: number; // margen bruto total (revenue - costo)
  marginPercent: number; // % sobre revenue
  timesSold: number; // nº de tickets que incluyeron el producto
  lastSaleDate?: Date | null; // última venta registrada (histórico)
  daysSinceLastSale?: number | null;
  currentStock: number; // stock actual disponible
  sellThroughRate: number; // % vendido vs (vendido + stock)
  weeksOfCover: number | null; // semanas de cobertura según ritmo del período
  shrinkageUnits: number; // unidades perdidas por mermas en el período
  shrinkageValue: number; // valor económico perdido en el período
  expiringUnits: number; // unidades activas próximas a vencer
  rank: number; // posición por unidades vendidas (1 = más rotativo)
}

export interface SlowMovingProductDto {
  productId: string;
  productName: string;
  sku?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  unitsSold: number;
  revenue: number;
  lastSaleDate?: Date | null;
  daysSinceLastSale?: number | null;
  currentStock: number;
  inventoryValue: number; // capital inmovilizado (stock * costo promedio)
  shrinkageUnits: number;
  shrinkageValue: number;
  expiringUnits: number;
  reason: 'SIN_VENTAS' | 'VENTA_BAJA';
}

export interface ShrinkageByProductDto {
  productId: string;
  productName: string;
  sku?: string | null;
  recordCount: number;
  totalUnits: number;
  totalLoss: number;
  lossPercentOfSales: number; // unidades perdidas vs unidades vendidas (%)
  byReason: Record<string, number>; // unidades perdidas agrupadas por motivo
}

export interface ShrinkageSummaryDto {
  totalRecords: number;
  totalUnits: number;
  totalLoss: number;
  byReason: { reason: string; count: number; units: number; value: number }[];
  topProducts: ShrinkageByProductDto[];
  period: { startDate: Date; endDate: Date };
}

export interface ExpiringRiskDto {
  batchId: string;
  productId: string;
  productName: string;
  sku?: string | null;
  batchNumber: string;
  expirationDate: Date;
  daysUntilExpiration: number;
  quantity: number;
  unitCost: number;
  valueAtRisk: number;
  weeklyVelocity: number; // unidades/semana vendidas en el período de referencia
  projectedSellableUnits: number; // unidades que se espera vender antes del vencimiento
  projectedLossUnits: number; // unidades que probablemente no se venderán
  projectedLossValue: number; // valor estimado en riesgo
  riskLevel: 'ALTO' | 'MEDIO' | 'BAJO';
}

export interface PurchaseSuggestionsDto {
  productId: string;
  productName: string;
  sku?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  priority: 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAJA';
  reasons: string[];
  suggestedQuantity: number;
  estimatedUnitCost: number;
  estimatedValue: number;
  metrics: {
    weeklyVelocity: number;
    currentStock: number;
    lowStockThreshold: number;
    safetyDays: number;
    leadTimeDays: number;
    daysSinceLastSale: number | null;
    expiringSoonUnits: number;
    shrinkageUnitsPeriod: number;
  };
}

export interface RotationDashboardDto {
  period: { startDate: Date; endDate: Date };
  totals: {
    productsTracked: number;
    unitsSold: number;
    revenue: number;
    fastMovers: number;
    slowMovers: number;
    outOfStockBestSellers: number;
    shrinkageValue: number;
    expiringValueAtRisk: number;
  };
  concentration: {
    top20RevenueShare: number; // % del ingreso aportado por el 20% de productos más vendidos
    bottom50RevenueShare: number; // % del ingreso aportado por el 50% menos vendido
  };
  rotationBuckets: { bucket: string; productCount: number; revenue: number }[];
  movementCategories: {
    rising: number;
    falling: number;
    stable: number;
    newProducts: number;
    discontinuedRisk: number;
  };
  topMovers: ProductRotationDto[];
  bottomMovers: ProductRotationDto[];
  purchaseSuggestions: PurchaseSuggestionsDto[];
}

export interface MovementTrendDto {
  productId: string;
  productName: string;
  sku?: string | null;
  currentPeriodUnits: number;
  previousPeriodUnits: number;
  changePercent: number;
  trend: 'ALTA' | 'BAJA' | 'ESTABLE' | 'NUEVO' | 'DESAPARECIDO';
}

export interface ActivityMetricsDto {
  totalActions: number;
  actionsByType: Record<string, number>;
  topUsers: {
    userId: string;
    userName: string;
    actionCount: number;
  }[];
  topEntities: {
    entityType: string;
    actionCount: number;
  }[];
  period: {
    startDate: Date;
    endDate: Date;
  };
}

export type ExportFormat = 'csv' | 'json';
