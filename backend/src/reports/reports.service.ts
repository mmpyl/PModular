import { Injectable, BadRequestException, StreamableFile } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  DateRangeDto,
  SalesSummaryDto,
  SalesByCategoryDto,
  TopProductDto,
  InventorySummaryDto,
  InventoryByCategoryDto,
  StockMovementSummaryDto,
  MovementsByReasonDto,
  PurchaseSummaryDto,
  PurchasesBySupplierDto,
  CashRegisterSummaryDto,
  DashboardMetricsDto,
  ExpiringBatchesDto,
  LowStockDto,
  PeriodComparisonDto,
  ActivityMetricsDto,
  ExportFormat,
  RotationFiltersDto,
  ProductRotationDto,
  SlowMovingProductDto,
  ShrinkageByProductDto,
  ShrinkageSummaryDto,
  ExpiringRiskDto,
  PurchaseSuggestionsDto,
  RotationDashboardDto,
  MovementTrendDto,
} from './dto/reports.dto';
import { Parser } from 'json2csv';
import * as ExcelJS from 'exceljs';

interface RotationSold {
  units: number;
  revenue: number;
  cost: number;
  tickets: number;
}

interface RotationShrinkage {
  units: number;
  value: number;
  byReason: Record<string, number>;
  count: number;
}

interface RotationStock {
  qty: number;
  avgCost: number;
}

interface RotationData {
  startDate: Date;
  endDate: Date;
  periodDays: number;
  products: Map<string, any>;
  sold: Map<string, RotationSold>;
  shrinkage: Map<string, RotationShrinkage>;
  expiring: Map<string, number>;
  stock: Map<string, RotationStock>;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper para obtener rango de fechas válido
   */
  private getDateRange(dto: DateRangeDto): { startDate: Date; endDate: Date } {
    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();
    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : new Date(new Date().setMonth(endDate.getMonth() - 1));

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    return { startDate, endDate };
  }

  /**
   * Resumen de ventas en un período determinado
   */
  async getSalesSummary(
    organizationId: string,
    dto: DateRangeDto,
  ): Promise<SalesSummaryDto> {
    const { startDate, endDate } = this.getDateRange(dto);

    // Configurar filtros de fecha
    const where: any = {
      organizationId,
      saleDate: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ['CONFIRMADA', 'COMPLETADA', 'EN_PROCESO'],
      },
    };

    const sales = await this.prisma.sale.findMany({
      where,
      select: {
        total: true,
        subtotal: true,
        taxAmount: true,
        discount: true,
      },
    });

    const totalRevenue = sales.reduce(
      (sum, sale) => sum + Number(sale.total),
      0,
    );
    const totalTax = sales.reduce(
      (sum, sale) => sum + Number(sale.taxAmount),
      0,
    );
    const totalDiscount = sales.reduce(
      (sum, sale) => sum + Number(sale.discount),
      0,
    );
    const salesCount = sales.length;
    const averageTicket = salesCount > 0 ? totalRevenue / salesCount : 0;

    return {
      totalSales: salesCount,
      totalRevenue,
      totalTax,
      totalDiscount,
      averageTicket,
      salesCount,
      period: { startDate, endDate },
    };
  }

  /**
   * Ventas agrupadas por categoría
   */
  async getSalesByCategory(
    organizationId: string,
    dto: DateRangeDto,
  ): Promise<SalesByCategoryDto[]> {
    const { startDate, endDate } = this.getDateRange(dto);

    const result = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          organizationId,
          saleDate: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            in: ['CONFIRMADA', 'COMPLETADA', 'EN_PROCESO'],
          },
        },
      },
      _sum: {
        quantity: true,
        total: true,
      },
    });

    // Obtener información de productos y categorías
    const productIds = result.map((r) => r.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        category: true,
      },
    });

    // Agrupar por categoría
    const categoryMap = new Map<
      string,
      { categoryId: string; categoryName: string; totalQuantity: number; totalRevenue: number }
    >();

    result.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      const categoryId = product?.categoryId || 'SIN_CATEGORIA';
      const categoryName = product?.category?.name || 'Sin Categoría';

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName,
          totalQuantity: 0,
          totalRevenue: 0,
        });
      }

      const category = categoryMap.get(categoryId)!;
      category.totalQuantity += Number(item._sum.quantity || 0);
      category.totalRevenue += Number(item._sum.total || 0);
    });

    // Calcular total para porcentajes
    const grandTotal = Array.from(categoryMap.values()).reduce(
      (sum, cat) => sum + cat.totalRevenue,
      0,
    );

    return Array.from(categoryMap.values()).map((cat) => ({
      ...cat,
      percentage: grandTotal > 0 ? (cat.totalRevenue / grandTotal) * 100 : 0,
    }));
  }

  /**
   * Top productos más vendidos
   */
  async getTopProducts(
    organizationId: string,
    dto: DateRangeDto,
    limit: number = 10,
  ): Promise<TopProductDto[]> {
    const { startDate, endDate } = this.getDateRange(dto);

    const items = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          organizationId,
          saleDate: { gte: startDate, lte: endDate },
          status: { in: ['CONFIRMADA', 'COMPLETADA', 'EN_PROCESO'] },
        },
      },
      select: {
        productId: true,
        quantity: true,
        total: true,
        product: { select: { name: true, sku: true } },
      },
    });

    const totals = new Map<string, { name: string; sku: string | null; quantity: number; revenue: number }>();
    for (const item of items) {
      const current = totals.get(item.productId) ?? {
        name: item.product.name,
        sku: item.product.sku,
        quantity: 0,
        revenue: 0,
      };
      current.quantity += Number(item.quantity);
      current.revenue += Number(item.total);
      totals.set(item.productId, current);
    }

    return [...totals.entries()]
      .sort(([, first], [, second]) => second.quantity - first.quantity)
      .slice(0, limit)
      .map(([productId, item], index) => {
      return {
        productId,
        productName: item.name,
        sku: item.sku,
        totalQuantity: item.quantity,
        totalRevenue: item.revenue,
        rank: index + 1,
      };
      });
  }

  /**
   * Resumen de inventario en un período determinado
   */
  async getInventorySummary(
    organizationId: string,
    dto?: DateRangeDto,
  ): Promise<InventorySummaryDto> {
    // Total de productos activos
    const totalProducts = await this.prisma.product.count({
      where: {
        organizationId,
        isActive: true,
      },
    });

    // Si hay filtro de fechas, aplicarlo al inventario
    let whereClause: any = { organizationId };
    if (dto?.startDate || dto?.endDate) {
      const { startDate, endDate } = this.getDateRange(dto);
      whereClause.updatedAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Items de inventario
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: whereClause,
      select: {
        quantity: true,
        averageCost: true,
        product: {
          select: {
            isActive: true,
          },
        },
      },
    });

    const totalItems = inventoryItems.reduce(
      (sum, item) => sum + Number(item.quantity),
      0,
    );

    const totalValue = inventoryItems.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.averageCost),
      0,
    );

    const lowStockItems = inventoryItems.filter(
      (item) => Number(item.quantity) <= 10 && Number(item.quantity) > 0,
    ).length;

    const outOfStockItems = inventoryItems.filter(
      (item) => Number(item.quantity) <= 0,
    ).length;

    // Lotes próximos a vencer (30 días)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringSoonItems = await this.prisma.batch.count({
      where: {
        organizationId,
        status: 'ACTIVO',
        expirationDate: {
          lte: thirtyDaysFromNow,
        },
      },
    });

    return {
      totalProducts,
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      expiringSoonItems,
    };
  }

  /**
   * Inventario valorizado por categoría
   */
  async getInventoryByCategory(
    organizationId: string,
    dto?: DateRangeDto,
  ): Promise<InventoryByCategoryDto[]> {
    let whereClause: any = {
      organizationId,
      isActive: true,
    };

    // Si hay filtro de fechas, aplicarlo a productos actualizados en ese período
    if (dto?.startDate || dto?.endDate) {
      const { startDate, endDate } = this.getDateRange(dto);
      whereClause.updatedAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const products = await this.prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        inventory: true,
      },
    });

    const categoryMap = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        productCount: number;
        totalQuantity: number;
        totalValue: number;
      }
    >();

    products.forEach((product) => {
      const categoryId = product.categoryId || 'SIN_CATEGORIA';
      const categoryName = product.category?.name || 'Sin Categoría';

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName,
          productCount: 0,
          totalQuantity: 0,
          totalValue: 0,
        });
      }

      const category = categoryMap.get(categoryId)!;
      category.productCount += 1;

      product.inventory.forEach((inv) => {
        category.totalQuantity += Number(inv.quantity);
        category.totalValue += Number(inv.quantity) * Number(inv.averageCost);
      });
    });

    return Array.from(categoryMap.values());
  }

  /**
   * Resumen de movimientos de stock
   */
  async getStockMovementSummary(
    organizationId: string,
    dto: DateRangeDto,
  ): Promise<StockMovementSummaryDto> {
    const { startDate, endDate } = this.getDateRange(dto);

    const movements = await this.prisma.stockMovement.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        type: true,
        reason: true,
        quantity: true,
        isPositive: true,
      },
    });

    let totalIngresses = 0;
    let totalExits = 0;

    const reasonMap = new Map<
      string,
      { reason: string; count: number; totalQuantity: number }
    >();

    movements.forEach((movement) => {
      if (movement.isPositive) {
        totalIngresses += Number(movement.quantity);
      } else {
        totalExits += Number(movement.quantity);
      }

      const reasonKey = movement.reason;
      if (!reasonMap.has(reasonKey)) {
        reasonMap.set(reasonKey, {
          reason: reasonKey,
          count: 0,
          totalQuantity: 0,
        });
      }

      const reasonData = reasonMap.get(reasonKey)!;
      reasonData.count += 1;
      reasonData.totalQuantity += Number(movement.quantity);
    });

    return {
      totalIngresses,
      totalExits,
      netBalance: totalIngresses - totalExits,
      movementsByReason: Array.from(reasonMap.values()),
      period: { startDate, endDate },
    };
  }

  /**
   * Resumen de compras
   */
  async getPurchaseSummary(
    organizationId: string,
    dto: DateRangeDto,
  ): Promise<PurchaseSummaryDto> {
    const { startDate, endDate } = this.getDateRange(dto);

    const purchases = await this.prisma.purchaseOrder.findMany({
      where: {
        organizationId,
        orderDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['CONFIRMADA', 'PARCIALMENTE_RECIBIDA', 'COMPLETADA'],
        },
      },
      select: {
        total: true,
        taxAmount: true,
      },
    });

    const totalSpent = purchases.reduce(
      (sum, purchase) => sum + Number(purchase.total),
      0,
    );
    const totalTax = purchases.reduce(
      (sum, purchase) => sum + Number(purchase.taxAmount),
      0,
    );
    const purchaseCount = purchases.length;
    const averageOrderValue = purchaseCount > 0 ? totalSpent / purchaseCount : 0;

    return {
      totalPurchases: purchaseCount,
      totalSpent,
      totalTax,
      averageOrderValue,
      purchaseCount,
      period: { startDate, endDate },
    };
  }

  /**
   * Compras por proveedor
   */
  async getPurchasesBySupplier(
    organizationId: string,
    dto: DateRangeDto,
  ): Promise<PurchasesBySupplierDto[]> {
    const { startDate, endDate } = this.getDateRange(dto);

    const result = await this.prisma.purchaseOrder.groupBy({
      by: ['supplierId'],
      where: {
        organizationId,
        orderDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['CONFIRMADA', 'PARCIALMENTE_RECIBIDA', 'COMPLETADA'],
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
    });

    const supplierIds = result.map((r) => r.supplierId);
    const suppliers = await this.prisma.businessEntity.findMany({
      where: { id: { in: supplierIds } },
      select: {
        id: true,
        name: true,
      },
    });

    const grandTotal = result.reduce(
      (sum, r) => sum + Number(r._sum.total || 0),
      0,
    );

    return result.map((item) => {
      const supplier = suppliers.find((s) => s.id === item.supplierId)!;
      const totalSpent = Number(item._sum.total || 0);
      return {
        supplierId: item.supplierId,
        supplierName: supplier.name,
        totalOrders: item._count.id,
        totalSpent,
        percentage: grandTotal > 0 ? (totalSpent / grandTotal) * 100 : 0,
      };
    });
  }

  /**
   * Resumen de caja
   */
  async getCashRegisterSummary(
    organizationId: string,
    dto: DateRangeDto,
  ): Promise<CashRegisterSummaryDto> {
    const { startDate, endDate } = this.getDateRange(dto);

    const movements = await this.prisma.cashRegisterMovement.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        type: true,
        amount: true,
        isPositive: true,
      },
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalOpenings = 0;
    let totalClosings = 0;

    movements.forEach((movement) => {
      switch (movement.type) {
        case 'APERTURA':
          totalOpenings += 1;
          break;
        case 'CIERRE':
          totalClosings += 1;
          break;
        default:
          if (movement.isPositive) {
            totalIncome += Number(movement.amount);
          } else {
            totalExpenses += Number(movement.amount);
          }
      }
    });

    // Calcular discrepancias (cierres vs balance esperado)
    const cashRegisters = await this.prisma.cashRegister.findMany({
      where: {
        organizationId,
        closedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        expectedClosingBalance: true,
        actualClosingBalance: true,
        difference: true,
      },
    });

    const discrepancies = cashRegisters.reduce(
      (sum, reg) => sum + Math.abs(Number(reg.difference || 0)),
      0,
    );

    return {
      totalOpenings,
      totalClosings,
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      discrepancies,
      period: { startDate, endDate },
    };
  }

  /**
   * Métricas principales para dashboard
   */
  async getDashboardMetrics(
    organizationId: string,
  ): Promise<DashboardMetricsDto> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Ventas hoy
    const salesToday = await this.prisma.sale.aggregate({
      where: {
        organizationId,
        saleDate: { gte: today },
        status: { in: ['CONFIRMADA', 'COMPLETADA'] },
      },
      _sum: { total: true },
      _count: { id: true },
    });

    // Ventas esta semana
    const salesWeek = await this.prisma.sale.aggregate({
      where: {
        organizationId,
        saleDate: { gte: weekAgo },
        status: { in: ['CONFIRMADA', 'COMPLETADA'] },
      },
      _sum: { total: true },
      _count: { id: true },
    });

    // Ventas este mes
    const salesMonth = await this.prisma.sale.aggregate({
      where: {
        organizationId,
        saleDate: { gte: monthAgo },
        status: { in: ['CONFIRMADA', 'COMPLETADA'] },
      },
      _sum: { total: true },
      _count: { id: true },
    });

    // Calcular crecimiento semanal
    const previousWeekStart = new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
    const salesPreviousWeek = await this.prisma.sale.aggregate({
      where: {
        organizationId,
        saleDate: {
          gte: previousWeekStart,
          lt: weekAgo,
        },
        status: { in: ['CONFIRMADA', 'COMPLETADA'] },
      },
      _sum: { total: true },
    });

    const revenueToday = Number(salesToday._sum.total || 0);
    const revenueWeek = Number(salesWeek._sum.total || 0);
    const revenueMonth = Number(salesMonth._sum.total || 0);
    const revenuePreviousWeek = Number(salesPreviousWeek._sum.total || 0);

    const growth =
      revenuePreviousWeek > 0
        ? ((revenueWeek - revenuePreviousWeek) / revenuePreviousWeek) * 100
        : 0;

    // Inventario
    const inventorySummary = await this.getInventorySummary(organizationId);

    // Top productos del mes
    const topProducts = await this.getTopProducts(organizationId, {
      startDate: monthAgo.toISOString(),
      endDate: now.toISOString(),
    });

    // Clientes
    const totalCustomers = await this.prisma.businessEntity.count({
      where: {
        organizationId,
        entityType: { in: ['CLIENTE', 'AMBOS'] },
        isActive: true,
      },
    });

    const activeCustomers = await this.prisma.sale.groupBy({
      by: ['customerId'],
      where: {
        organizationId,
        saleDate: { gte: monthAgo },
        customerId: { not: null },
      },
    });

    return {
      sales: {
        today: salesToday._count.id,
        thisWeek: salesWeek._count.id,
        thisMonth: salesMonth._count.id,
        growth,
      },
      revenue: {
        today: revenueToday,
        thisWeek: revenueWeek,
        thisMonth: revenueMonth,
        growth,
      },
      inventory: {
        totalValue: inventorySummary.totalValue,
        lowStockAlerts: inventorySummary.lowStockItems,
        expiringAlerts: inventorySummary.expiringSoonItems,
      },
      customers: {
        total: totalCustomers,
        activeThisMonth: activeCustomers.length,
      },
      topProducts,
    };
  }

  /**
   * Lotes próximos a vencer
   */
  async getExpiringBatches(
    organizationId: string,
    daysThreshold: number = 30,
  ): Promise<ExpiringBatchesDto[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysThreshold);

    const batches = await this.prisma.batch.findMany({
      where: {
        organizationId,
        status: 'ACTIVO',
        expirationDate: {
          lte: futureDate,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        expirationDate: 'asc',
      },
    });

    return batches.map((batch) => {
      const daysUntilExpiration = Math.ceil(
        (batch.expirationDate!.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      );

      return {
        batchId: batch.id,
        productId: batch.productId,
        productName: batch.product.name,
        batchNumber: batch.batchNumber,
        expirationDate: batch.expirationDate!,
        currentQuantity: Number(batch.currentQuantity),
        daysUntilExpiration,
      };
    });
  }

  /**
   * Productos con stock bajo - usa el lowStockThreshold de cada producto
   */
  async getLowStockProducts(
    organizationId: string,
    _threshold?: number, // Deprecated: ahora se usa el threshold por producto
  ): Promise<LowStockDto[]> {
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: {
        organizationId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: {
              select: {
                name: true,
              },
            },
            lowStockThreshold: true,
          },
        },
        batches: {
          where: {
            status: 'ACTIVO',
          },
          select: {
            id: true,
            currentQuantity: true,
            expirationDate: true,
          },
        },
      },
    });

    // Filtrar productos donde el stock actual está por debajo de su umbral específico
    return inventoryItems
      .filter((item) => Number(item.quantity) <= Number(item.product.lowStockThreshold))
      .map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        currentQuantity: Number(item.quantity),
        lowStockThreshold: Number(item.product.lowStockThreshold),
        unitName: item.product.unit?.name,
        batches: item.batches.map((batch) => ({
          batchId: batch.id,
          quantity: Number(batch.currentQuantity),
          expirationDate: batch.expirationDate || undefined,
        })),
      }));
  }

  /**
   * Exportar datos a CSV
   */
  exportToCSV<T>(data: T[], fields?: string[]): Buffer {
    try {
      const parser = new Parser({ fields });
      const csv = parser.parse(data);
      return Buffer.from(csv, 'utf-8');
    } catch (error) {
      throw new BadRequestException('Failed to export data to CSV');
    }
  }

  /**
   * Exportar datos a Excel (.xlsx)
   */
  async exportToExcel<T>(
    data: T[],
    sheetName: string = 'Reporte',
    columns: { header: string; key: string }[],
  ): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistema ERP';
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet(sheetName, {
        properties: { tabColor: { argb: 'FF007BFF' } },
      });

      // Configurar columnas
      worksheet.columns = columns.map((col) => ({
        header: col.header,
        key: col.key,
        width: 20,
      }));

      // Estilar encabezados
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF007BFF' },
      };
      worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

      // Agregar datos
      data.forEach((row) => {
        worksheet.addRow(row as any);
      });

      // Autoajustar filas
      worksheet.eachRow((row) => {
        row.height = 20;
      });

      // Generar buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      throw new BadRequestException('Failed to export data to Excel');
    }
  }

  /**
   * Comparativa de ventas entre dos períodos
   */
  async getSalesComparison(
    organizationId: string,
    currentPeriod: { startDate: Date; endDate: Date },
    previousPeriod: { startDate: Date; endDate: Date },
  ): Promise<PeriodComparisonDto> {
    // Período actual
    const currentSales = await this.prisma.sale.aggregate({
      where: {
        organizationId,
        saleDate: {
          gte: currentPeriod.startDate,
          lte: currentPeriod.endDate,
        },
        status: { in: ['CONFIRMADA', 'COMPLETADA', 'EN_PROCESO'] },
      },
      _sum: { total: true },
      _count: { id: true },
    });

    // Período anterior
    const previousSales = await this.prisma.sale.aggregate({
      where: {
        organizationId,
        saleDate: {
          gte: previousPeriod.startDate,
          lte: previousPeriod.endDate,
        },
        status: { in: ['CONFIRMADA', 'COMPLETADA', 'EN_PROCESO'] },
      },
      _sum: { total: true },
      _count: { id: true },
    });

    const currentRevenue = Number(currentSales._sum.total || 0);
    const previousRevenue = Number(previousSales._sum.total || 0);
    const currentCount = currentSales._count.id;
    const previousCount = previousSales._count.id;

    const revenueGrowth =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    const salesGrowth =
      previousCount > 0
        ? ((currentCount - previousCount) / previousCount) * 100
        : 0;

    return {
      currentPeriod: {
        startDate: currentPeriod.startDate,
        endDate: currentPeriod.endDate,
        totalRevenue: currentRevenue,
        totalSales: currentCount,
      },
      previousPeriod: {
        startDate: previousPeriod.startDate,
        endDate: previousPeriod.endDate,
        totalRevenue: previousRevenue,
        totalSales: previousCount,
      },
      growth: {
        revenueGrowth,
        salesGrowth,
      },
    };
  }

  /**
   * Métricas de actividad basadas en AuditLog
   */
  async getActivityMetrics(
    organizationId: string,
    dto: DateRangeDto,
  ): Promise<ActivityMetricsDto> {
    const { startDate, endDate } = this.getDateRange(dto);

    // Contar acciones por tipo
    const actions = await this.prisma.auditLog.groupBy({
      by: ['action'],
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: { id: true },
    });

    // Usuarios más activos
    const userActivities = await this.prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        userId: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const userIds = userActivities
      .map((u) => u.userId)
      .filter((id): id is string => id !== null);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    // Entidades más modificadas
    const entityActivities = await this.prisma.auditLog.groupBy({
      by: ['entityType'],
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const actionMap = new Map<string, number>();
    actions.forEach((a) => {
      actionMap.set(a.action, a._count.id);
    });

    return {
      totalActions: actions.reduce((sum, a) => sum + a._count.id, 0),
      actionsByType: Object.fromEntries(actionMap),
      topUsers: userActivities.map((u) => {
        const user = users.find((usr) => usr.id === u.userId);
        return {
          userId: u.userId!,
          userName: user?.name || user?.email || 'Unknown',
          actionCount: u._count.id,
        };
      }),
      topEntities: entityActivities.map((e) => ({
        entityType: e.entityType,
        actionCount: e._count.id,
      })),
      period: { startDate, endDate },
    };
  }

  /**
   * Comparativa mes vs mes anterior
   */
  async getMonthOverMonthComparison(
    organizationId: string,
    referenceDate?: Date,
  ): Promise<PeriodComparisonDto> {
    const refDate = referenceDate || new Date();
    const currentMonthStart = new Date(
      refDate.getFullYear(),
      refDate.getMonth(),
      1,
    );
    const currentMonthEnd = new Date(
      refDate.getFullYear(),
      refDate.getMonth() + 1,
      0,
    );

    const previousMonthStart = new Date(
      refDate.getFullYear(),
      refDate.getMonth() - 1,
      1,
    );
    const previousMonthEnd = new Date(
      refDate.getFullYear(),
      refDate.getMonth(),
      0,
    );

    return this.getSalesComparison(organizationId, 
      { startDate: currentMonthStart, endDate: currentMonthEnd },
      { startDate: previousMonthStart, endDate: previousMonthEnd }
    );
  }

  // =========================================================================
  // FASE B6: Reportes de rotación — qué se vende más/menos, qué está por
  // vencer, qué genera mermas — decisiones de compra
  // =========================================================================

  private static readonly DAY_MS = 24 * 60 * 60 * 1000;
  private static readonly SALE_STATUSES = ['CONFIRMADA', 'COMPLETADA', 'EN_PROCESO'];

  /** Redondeo a 2 decimales para montos. */
  private r2(n: number): number {
    return Math.round(n * 100) / 100;
  }

  /**
   * Dataset base de rotación: combina ventas del período, stock actual,
   * última venta histórica, mermas (Fase B2) y unidades próximas a vencer.
   * Se reutiliza en varios endpoints para no duplicar consultas.
   */
  private async buildRotationData(
    organizationId: string,
    dto: RotationFiltersDto,
    daysThreshold: number,
  ): Promise<RotationData> {
    const { startDate, endDate } = this.getDateRange(dto);
    const periodDays = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / ReportsService.DAY_MS),
    );

    const productWhere: any = { organizationId, isActive: true };
    if (dto.categoryId) productWhere.categoryId = dto.categoryId;

    const products = await this.prisma.product.findMany({
      where: productWhere,
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        isFastSale: true,
        price: true,
        cost: true,
        lowStockThreshold: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
      },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));
    const productIds = products.map((p) => p.id);

    // --- Ventas del período (por producto) ---
    const saleItems = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        productId: { in: productIds },
        sale: {
          organizationId,
          saleDate: { gte: startDate, lte: endDate },
          status: { in: ReportsService.SALE_STATUSES },
        },
      },
      _sum: { quantity: true, total: true },
      _count: { saleId: true },
    });
    const sold = new Map<string, RotationSold>();
    for (const row of saleItems) {
      const product = productMap.get(row.productId);
      const units = Number(row._sum.quantity || 0);
      sold.set(row.productId, {
        units,
        revenue: Number(row._sum.total || 0),
        cost: units * Number(product?.cost ?? 0),
        tickets: row._count.saleId,
      });
    }

    // --- Última venta histórica por producto (para días sin rotar) ---
    const lastSalesRaw = await this.prisma.$queryRaw<
      { product_id: string; last_sale: Date }[]
    >`
      SELECT si."product_id" AS product_id, MAX(s."sale_date") AS last_sale
      FROM sale_items si
      JOIN sales s ON s.id = si."sale_id"
      WHERE s."organization_id" = ${organizationId}
        AND s.status IN ('CONFIRMADA', 'COMPLETADA', 'EN_PROCESO')
      GROUP BY si."product_id"
    `;
    for (const row of lastSalesRaw) {
      const product = productMap.get(row.product_id);
      if (product) {
        (product as any).lastSaleDate = row.last_sale ? new Date(row.last_sale) : null;
      }
    }

    // --- Mermas del período (Fase B2) ---
    const shrinkageRaw = await this.prisma.shrinkageRecord.groupBy({
      by: ['productId', 'reason'],
      where: {
        organizationId,
        productId: { in: productIds },
        occurredAt: { gte: startDate, lte: endDate },
      },
      _sum: { quantity: true, totalLoss: true },
      _count: { id: true },
    });
    const shrinkage = new Map<string, RotationShrinkage>();
    for (const row of shrinkageRaw) {
      const cur = shrinkage.get(row.productId) ?? {
        units: 0,
        value: 0,
        byReason: {},
        count: 0,
      };
      const units = Number(row._sum.quantity || 0);
      cur.units += units;
      cur.value += Number(row._sum.totalLoss || 0);
      cur.byReason[row.reason] = (cur.byReason[row.reason] || 0) + units;
      cur.count += row._count.id;
      shrinkage.set(row.productId, cur);
    }

    // --- Unidades activas próximas a vencer (por producto) ---
    const futureDate = new Date(endDate.getTime());
    futureDate.setDate(futureDate.getDate() + daysThreshold);
    const batches = await this.prisma.batch.findMany({
      where: {
        organizationId,
        productId: { in: productIds },
        status: 'ACTIVO',
        expirationDate: { not: null, lte: futureDate },
      },
      select: { productId: true, currentQuantity: true },
    });
    const expiring = new Map<string, number>();
    for (const b of batches) {
      expiring.set(
        b.productId,
        (expiring.get(b.productId) || 0) + Number(b.currentQuantity),
      );
    }

    // --- Stock actual (suma de inventario multi-almacén) ---
    const inventoryRows = await this.prisma.inventoryItem.groupBy({
      by: ['productId'],
      where: { organizationId, productId: { in: productIds } },
      _sum: { quantity: true },
    });
    const invProducts = await this.prisma.inventoryItem.findMany({
      where: { organizationId, productId: { in: productIds } },
      select: { productId: true, quantity: true, averageCost: true },
    });
    const avgCostAcc = new Map<string, { qty: number; val: number }>();
    for (const inv of invProducts) {
      const qty = Number(inv.quantity);
      if (qty > 0) {
        const prev = avgCostAcc.get(inv.productId) ?? { qty: 0, val: 0 };
        prev.qty += qty;
        prev.val += qty * Number(inv.averageCost);
        avgCostAcc.set(inv.productId, prev);
      }
    }
    const stock = new Map<string, RotationStock>();
    for (const row of inventoryRows) {
      const qty = Number(row._sum.quantity || 0);
      const acc = avgCostAcc.get(row.productId);
      stock.set(row.productId, {
        qty,
        avgCost: acc && acc.qty > 0 ? acc.val / acc.qty : 0,
      });
    }

    return {
      startDate,
      endDate,
      periodDays,
      products: productMap,
      sold,
      shrinkage,
      expiring,
      stock,
    };
  }

  /** Métricas derivadas de un producto dentro del dataset de rotación. */
  private computeRotationRow(data: RotationData, productId: string) {
    const product = data.products.get(productId)!;
    const s = data.sold.get(productId) ?? { units: 0, revenue: 0, cost: 0, tickets: 0 };
    const sh = data.shrinkage.get(productId) ?? {
      units: 0,
      value: 0,
      byReason: {},
      count: 0,
    };
    const expiringUnits = data.expiring.get(productId) || 0;
    const stk = data.stock.get(productId) ?? { qty: 0, avgCost: 0 };

    const weeklyVelocity = (s.units / data.periodDays) * 7;
    const sellThroughDenom = s.units + stk.qty;
    const sellThroughRate =
      sellThroughDenom > 0 ? (s.units / sellThroughDenom) * 100 : 0;
    const weeksOfCover = weeklyVelocity > 0 ? stk.qty / weeklyVelocity : null;
    const lastSaleDate: Date | null = (product as any).lastSaleDate ?? null;
    const daysSinceLastSale = lastSaleDate
      ? Math.max(
          0,
          Math.floor(
            (new Date().getTime() - lastSaleDate.getTime()) / ReportsService.DAY_MS,
          ),
        )
      : null;
    const grossMargin = s.revenue - s.cost;
    const marginPercent = s.revenue > 0 ? (grossMargin / s.revenue) * 100 : 0;

    return {
      product,
      s,
      sh,
      expiringUnits,
      stk,
      weeklyVelocity,
      sellThroughRate,
      weeksOfCover,
      lastSaleDate,
      daysSinceLastSale,
      grossMargin,
      marginPercent,
    };
  }

  /**
   * Rotación por producto: ranking de más a menos vendido con margen,
   * cobertura de stock, mermas y unidades próximas a vencer.
   */
  async getProductRotation(
    organizationId: string,
    dto: RotationFiltersDto,
    daysThreshold: number = 30,
  ): Promise<ProductRotationDto[]> {
    const data = await this.buildRotationData(organizationId, dto, daysThreshold);
    const limit = dto.limit && dto.limit > 0 ? dto.limit : 50;

    const rows = [...data.products.keys()].map((id) => {
      const c = this.computeRotationRow(data, id);
      return {
        productId: id,
        productName: c.product.name,
        sku: c.product.sku,
        barcode: c.product.barcode,
        isFastSale: c.product.isFastSale,
        categoryId: c.product.categoryId,
        categoryName: c.product.category?.name ?? null,
        unitsSold: c.s.units,
        revenue: this.r2(c.s.revenue),
        grossMargin: this.r2(c.grossMargin),
        marginPercent: this.r2(c.marginPercent),
        timesSold: c.s.tickets,
        lastSaleDate: c.lastSaleDate,
        daysSinceLastSale: c.daysSinceLastSale,
        currentStock: c.stk.qty,
        sellThroughRate: this.r2(c.sellThroughRate),
        weeksOfCover:
          c.weeksOfCover != null ? Math.round(c.weeksOfCover * 10) / 10 : null,
        shrinkageUnits: c.sh.units,
        shrinkageValue: this.r2(c.sh.value),
        expiringUnits: c.expiringUnits,
        rank: 0,
      };
    });

    rows.sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue);
    rows.forEach((r, i) => (r.rank = i + 1));
    return rows.slice(0, limit);
  }

  /**
   * Productos de lenta rotación: sin ventas o con venta muy baja frente al
   * capital inmovilizado que mantienen en almacén.
   */
  async getSlowMovingProducts(
    organizationId: string,
    dto: RotationFiltersDto,
    options?: { minUnitsSold?: number; daysWithoutSales?: number },
  ): Promise<SlowMovingProductDto[]> {
    const minUnitsSold = options?.minUnitsSold ?? 1;
    const daysWithoutSales = options?.daysWithoutSales ?? 30;
    const data = await this.buildRotationData(organizationId, dto, 30);

    const result: SlowMovingProductDto[] = [];
    for (const id of data.products.keys()) {
      const c = this.computeRotationRow(data, id);
      const stale =
        c.daysSinceLastSale == null || c.daysSinceLastSale >= daysWithoutSales;
      const isSinVentas = c.s.units < minUnitsSold && stale;
      const isVentaBaja =
        !isSinVentas &&
        c.s.units < minUnitsSold * 3 &&
        c.weeksOfCover != null &&
        c.weeksOfCover > 8;

      if (!isSinVentas && !isVentaBaja) continue;

      result.push({
        productId: id,
        productName: c.product.name,
        sku: c.product.sku,
        categoryId: c.product.categoryId,
        categoryName: c.product.category?.name ?? null,
        unitsSold: c.s.units,
        revenue: this.r2(c.s.revenue),
        lastSaleDate: c.lastSaleDate,
        daysSinceLastSale: c.daysSinceLastSale,
        currentStock: c.stk.qty,
        inventoryValue: this.r2(c.stk.qty * c.stk.avgCost),
        shrinkageUnits: c.sh.units,
        shrinkageValue: this.r2(c.sh.value),
        expiringUnits: c.expiringUnits,
        reason: isSinVentas ? 'SIN_VENTAS' : 'VENTA_BAJA',
      });
    }

    // Lo más "caro" de mantener (capital inmovilizado + pérdidas) primero
    result.sort(
      (a, b) =>
        b.inventoryValue + b.shrinkageValue - (a.inventoryValue + a.shrinkageValue),
    );
    const limit = dto.limit && dto.limit > 0 ? dto.limit : 50;
    return result.slice(0, limit);
  }

  /**
   * Mermas agrupadas por producto y motivo, cruzadas con las unidades
   * vendidas del mismo período (% de pérdida real sobre lo que rota).
   */
  async getShrinkageByProduct(
    organizationId: string,
    dto: RotationFiltersDto,
  ): Promise<ShrinkageSummaryDto> {
    const { startDate, endDate } = this.getDateRange(dto);
    const limit = dto.limit && dto.limit > 0 ? dto.limit : 20;

    const records = await this.prisma.shrinkageRecord.findMany({
      where: {
        organizationId,
        occurredAt: { gte: startDate, lte: endDate },
        ...(dto.categoryId ? { product: { categoryId: dto.categoryId } } : {}),
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
      orderBy: { occurredAt: 'desc' },
    });

    const byReasonMap = new Map<
      string,
      { count: number; units: number; value: number }
    >();
    const byProductMap = new Map<
      string,
      {
        productName: string;
        sku: string | null;
        recordCount: number;
        totalUnits: number;
        totalLoss: number;
        byReason: Record<string, number>;
      }
    >();

    let totalUnits = 0;
    let totalLoss = 0;

    for (const rec of records) {
      const units = Number(rec.quantity);
      const value = Number(rec.totalLoss);
      totalUnits += units;
      totalLoss += value;

      const reasonCur = byReasonMap.get(rec.reason) ?? {
        count: 0,
        units: 0,
        value: 0,
      };
      reasonCur.count += 1;
      reasonCur.units += units;
      reasonCur.value += value;
      byReasonMap.set(rec.reason, reasonCur);

      const prodCur = byProductMap.get(rec.productId) ?? {
        productName: rec.product.name,
        sku: rec.product.sku,
        recordCount: 0,
        totalUnits: 0,
        totalLoss: 0,
        byReason: {},
      };
      prodCur.recordCount += 1;
      prodCur.totalUnits += units;
      prodCur.totalLoss += value;
      prodCur.byReason[rec.reason] = (prodCur.byReason[rec.reason] || 0) + units;
      byProductMap.set(rec.productId, prodCur);
    }

    // Unidades vendidas del período para calcular % de pérdida sobre rotación
    const shrinkProductIds = [...byProductMap.keys()];
    const soldRows = shrinkProductIds.length
      ? await this.prisma.saleItem.groupBy({
          by: ['productId'],
          where: {
            productId: { in: shrinkProductIds },
            sale: {
              organizationId,
              saleDate: { gte: startDate, lte: endDate },
              status: { in: ReportsService.SALE_STATUSES },
            },
          },
          _sum: { quantity: true },
        })
      : [];
    const soldUnits = new Map(
      soldRows.map((r) => [r.productId, Number(r._sum.quantity || 0)]),
    );

    const topProducts: ShrinkageByProductDto[] = [...byProductMap.entries()]
      .sort(([, a], [, b]) => b.totalLoss - a.totalLoss)
      .slice(0, limit)
      .map(([productId, p]) => {
        const soldQty = soldUnits.get(productId) || 0;
        return {
          productId,
          productName: p.productName,
          sku: p.sku,
          recordCount: p.recordCount,
          totalUnits: p.totalUnits,
          totalLoss: this.r2(p.totalLoss),
          lossPercentOfSales:
            soldQty > 0 ? this.r2((p.totalUnits / soldQty) * 100) : 0,
          byReason: p.byReason,
        };
      });

    return {
      totalRecords: records.length,
      totalUnits,
      totalLoss: this.r2(totalLoss),
      byReason: [...byReasonMap.entries()]
        .map(([reason, v]) => ({
          reason,
          count: v.count,
          units: v.units,
          value: this.r2(v.value),
        }))
        .sort((a, b) => b.value - a.value),
      topProducts,
      period: { startDate, endDate },
    };
  }

  /**
   * Riesgo de vencimiento: combina la fecha del lote con la velocidad de
   * venta reciente para proyectar cuántas unidades NO se venderán a tiempo.
   */
  async getExpiringRisk(
    organizationId: string,
    daysThreshold: number = 30,
    velocityWindowDays: number = 28,
  ): Promise<ExpiringRiskDto[]> {
    const now = new Date();
    const horizon = new Date(now.getTime() + daysThreshold * ReportsService.DAY_MS);
    const windowStart = new Date(
      now.getTime() - velocityWindowDays * ReportsService.DAY_MS,
    );

    const batches = await this.prisma.batch.findMany({
      where: {
        organizationId,
        status: 'ACTIVO',
        expirationDate: { not: null, lte: horizon },
        currentQuantity: { gt: 0 },
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
      orderBy: { expirationDate: 'asc' },
    });

    if (!batches.length) return [];

    const batchProductIds = [...new Set(batches.map((b) => b.productId))];
    const soldRows = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        productId: { in: batchProductIds },
        sale: {
          organizationId,
          saleDate: { gte: windowStart, lte: now },
          status: { in: ReportsService.SALE_STATUSES },
        },
      },
      _sum: { quantity: true },
    });
    const weeklyVelocity = new Map(
      soldRows.map((r) => [
        r.productId,
        (Number(r._sum.quantity || 0) / velocityWindowDays) * 7,
      ]),
    );

    return batches.map((batch) => {
      const daysUntil = Math.max(
        0,
        Math.ceil(
          (batch.expirationDate!.getTime() - now.getTime()) /
            ReportsService.DAY_MS,
        ),
      );
      const velocity = weeklyVelocity.get(batch.productId) || 0;
      const qty = Number(batch.currentQuantity);
      const unitCost = Number(batch.unitCost);
      const projectedSellable = Math.min(
        qty,
        Math.floor((velocity * daysUntil) / 7),
      );
      const projectedLossUnits = Math.max(0, qty - projectedSellable);
      const projectedLossValue = this.r2(projectedLossUnits * unitCost);
      const riskLevel: ExpiringRiskDto['riskLevel'] =
        projectedLossUnits === 0
          ? 'BAJO'
          : projectedLossUnits >= qty * 0.5 || daysUntil <= 7
            ? 'ALTO'
            : 'MEDIO';

      return {
        batchId: batch.id,
        productId: batch.productId,
        productName: batch.product.name,
        sku: batch.product.sku,
        batchNumber: batch.batchNumber,
        expirationDate: batch.expirationDate!,
        daysUntilExpiration: daysUntil,
        quantity: qty,
        unitCost,
        valueAtRisk: this.r2(qty * unitCost),
        weeklyVelocity: Math.round(velocity * 100) / 100,
        projectedSellableUnits: projectedSellable,
        projectedLossUnits,
        projectedLossValue,
        riskLevel,
      };
    });
  }

  /**
   * Sugerencias de compra basadas en rotación: demanda semanal, lead time,
   * stock de seguridad, umbral bajo, mermas y unidades próximas a vencer.
   */
  async getPurchaseSuggestions(
    organizationId: string,
    dto: RotationFiltersDto,
    options?: { safetyDays?: number; leadTimeDays?: number },
  ): Promise<PurchaseSuggestionsDto[]> {
    const safetyDays = options?.safetyDays ?? 7;
    const leadTimeDays = options?.leadTimeDays ?? 3;
    const horizonDays = safetyDays + leadTimeDays;

    const data = await this.buildRotationData(organizationId, dto, 30);
    const suggestions: PurchaseSuggestionsDto[] = [];

    for (const id of data.products.keys()) {
      const c = this.computeRotationRow(data, id);
      const reasons: string[] = [];
      let suggestedQty = 0;

      if (c.s.units > 0) {
        const demandInHorizon = (c.s.units / data.periodDays) * horizonDays;
        const cover = c.stk.qty - demandInHorizon;
        if (cover < 0) {
          reasons.push(
            `Cobertura insuficiente para ${horizonDays} días (déficit ${Math.abs(
              this.r2(cover),
            )})`,
          );
          suggestedQty = Math.ceil(-cover);
        }
        if (c.stk.qty <= Number(c.product.lowStockThreshold)) {
          reasons.push('Stock en o por debajo del mínimo configurado');
          const toTarget =
            Math.max(
              Number(c.product.lowStockThreshold) * 2,
              Math.ceil(demandInHorizon),
            ) - c.stk.qty;
          suggestedQty = Math.max(suggestedQty, Math.ceil(toTarget));
        }
        if (c.stk.qty === 0) {
          reasons.push('Producto agotado (venta perdida potencial)');
          suggestedQty = Math.max(suggestedQty, Math.ceil(demandInHorizon) || 1);
        }
      } else {
        // Sin ventas en el período: no sugerir compra
        continue;
      }

      if (suggestedQty <= 0) continue;

      const estimatedUnitCost = Number(c.product.cost ?? 0) || c.stk.avgCost;
      const priority: PurchaseSuggestionsDto['priority'] =
        c.stk.qty === 0
          ? 'URGENTE'
          : c.stk.qty <= Number(c.product.lowStockThreshold)
            ? 'ALTA'
            : c.weeksOfCover != null && c.weeksOfCover < 2
              ? 'MEDIA'
              : 'BAJA';

      suggestions.push({
        productId: id,
        productName: c.product.name,
        sku: c.product.sku,
        categoryId: c.product.categoryId,
        categoryName: c.product.category?.name ?? null,
        priority,
        reasons,
        suggestedQuantity: suggestedQty,
        estimatedUnitCost: this.r2(estimatedUnitCost),
        estimatedValue: this.r2(suggestedQty * estimatedUnitCost),
        metrics: {
          weeklyVelocity: Math.round(c.weeklyVelocity * 100) / 100,
          currentStock: c.stk.qty,
          lowStockThreshold: Number(c.product.lowStockThreshold),
          safetyDays,
          leadTimeDays,
          daysSinceLastSale: c.daysSinceLastSale,
          expiringSoonUnits: c.expiringUnits,
          shrinkageUnitsPeriod: c.sh.units,
        },
      });
    }

    const order = { URGENTE: 0, ALTA: 1, MEDIA: 2, BAJA: 3 };
    suggestions.sort(
      (a, b) =>
        order[a.priority] - order[b.priority] ||
        b.metrics.weeklyVelocity - a.metrics.weeklyVelocity,
    );
    const limit = dto.limit && dto.limit > 0 ? dto.limit : 50;
    return suggestions.slice(0, limit);
  }

  /** Comparativa de unidades vendidas período actual vs anterior inmediato. */
  async getMovementTrends(
    organizationId: string,
    dto: RotationFiltersDto,
  ): Promise<MovementTrendDto[]> {
    const { startDate, endDate } = this.getDateRange(dto);
    const periodMs = endDate.getTime() - startDate.getTime();
    const prevStart = new Date(startDate.getTime() - periodMs);
    const prevEnd = new Date(startDate.getTime());

    const productWhere: any = { organizationId, isActive: true };
    if (dto.categoryId) productWhere.categoryId = dto.categoryId;
    const trendProducts = await this.prisma.product.findMany({
      where: productWhere,
      select: { id: true, name: true, sku: true },
    });
    const trendProductIds = trendProducts.map((p) => p.id);

    const groupFor = (from: Date, to: Date) =>
      this.prisma.saleItem.groupBy({
        by: ['productId'],
        where: {
          productId: { in: trendProductIds },
          sale: {
            organizationId,
            saleDate: { gte: from, lte: to },
            status: { in: ReportsService.SALE_STATUSES },
          },
        },
        _sum: { quantity: true },
      });

    const [current, previous] = await Promise.all([
      groupFor(startDate, endDate),
      groupFor(prevStart, prevEnd),
    ]);

    const curMap = new Map(
      current.map((r) => [r.productId, Number(r._sum.quantity || 0)]),
    );
    const prevMap = new Map(
      previous.map((r) => [r.productId, Number(r._sum.quantity || 0)]),
    );

    const trends: MovementTrendDto[] = trendProducts.map((p) => {
      const cur = curMap.get(p.id) || 0;
      const prev = prevMap.get(p.id) || 0;
      const changePercent =
        prev > 0 ? ((cur - prev) / prev) * 100 : cur > 0 ? 100 : 0;
      let trend: MovementTrendDto['trend'];
      if (prev === 0 && cur > 0) trend = 'NUEVO';
      else if (cur === 0 && prev > 0) trend = 'DESAPARECIDO';
      else if (changePercent >= 15) trend = 'ALTA';
      else if (changePercent <= -15) trend = 'BAJA';
      else trend = 'ESTABLE';
      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        currentPeriodUnits: cur,
        previousPeriodUnits: prev,
        changePercent: this.r2(changePercent),
        trend,
      };
    });

    trends.sort(
      (a, b) =>
        Math.abs(b.changePercent) - Math.abs(a.changePercent) ||
        b.currentPeriodUnits - a.currentPeriodUnits,
    );
    const limit = dto.limit && dto.limit > 0 ? dto.limit : 50;
    return trends.slice(0, limit);
  }

  /**
   * Panel consolidado de rotación: resumen ejecutivo para decisiones de
   * compra (top/flop, concentración Pareto, riesgo de vencimiento y mermas).
   */
  async getRotationDashboard(
    organizationId: string,
    dto: RotationFiltersDto,
    daysThreshold: number = 30,
  ): Promise<RotationDashboardDto> {
    const data = await this.buildRotationData(organizationId, dto, daysThreshold);

    const allRows = [...data.products.keys()]
      .map((id) => {
        const c = this.computeRotationRow(data, id);
        return {
          productId: id,
          units: c.s.units,
          revenue: c.s.revenue,
          stock: c.stk.qty,
          shrinkageValue: c.sh.value,
          expiringUnits: c.expiringUnits,
          weeklyVelocity: c.weeklyVelocity,
        };
      })
      .sort((a, b) => b.units - a.units || b.revenue - a.revenue);

    const totalRevenue = allRows.reduce((s, r) => s + r.revenue, 0);
    const totalUnits = allRows.reduce((s, r) => s + r.units, 0);
    const n = allRows.length;
    const top20Count = Math.max(1, Math.ceil(n * 0.2));
    const bottom50Start = Math.floor(n * 0.5);
    const top20Revenue = allRows
      .slice(0, top20Count)
      .reduce((s, r) => s + r.revenue, 0);
    const bottom50Revenue = allRows
      .slice(bottom50Start)
      .reduce((s, r) => s + r.revenue, 0);

    const fastMovers = allRows.filter((r) => r.units > 0).length;
    const slowMovers = n - fastMovers;
    const outOfStockBestSellers = allRows.filter(
      (r) => r.stock === 0 && r.units > 0,
    ).length;
    const shrinkageValue = allRows.reduce((s, r) => s + r.shrinkageValue, 0);

    // Buckets de rotación semanal
    const buckets: { bucket: string; test: (v: number) => boolean }[] = [
      { bucket: 'Alta (>20/sem)', test: (v) => v > 20 },
      { bucket: 'Media (5-20/sem)', test: (v) => v > 5 && v <= 20 },
      { bucket: 'Baja (1-5/sem)', test: (v) => v >= 1 && v <= 5 },
      { bucket: 'Muy baja (<1/sem)', test: (v) => v > 0 && v < 1 },
      { bucket: 'Sin movimiento', test: (v) => v === 0 },
    ];
    const rotationBuckets = buckets.map((b) => {
      const items = allRows.filter((r) => b.test(r.weeklyVelocity));
      return {
        bucket: b.bucket,
        productCount: items.length,
        revenue: this.r2(items.reduce((s, r) => s + r.revenue, 0)),
      };
    });

    // Tendencias de movimiento (vs período anterior de igual duración)
    const trends = await this.getMovementTrends(organizationId, {
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
      categoryId: dto.categoryId,
      limit: 100000,
    });
    const movementCategories = {
      rising: trends.filter((t) => t.trend === 'ALTA').length,
      falling: trends.filter((t) => t.trend === 'BAJA').length,
      stable: trends.filter((t) => t.trend === 'ESTABLE').length,
      newProducts: trends.filter((t) => t.trend === 'NUEVO').length,
      discontinuedRisk: trends.filter((t) => t.trend === 'DESAPARECIDO').length,
    };

    // Valor en riesgo por vencimientos (proyección con velocidad real)
    const expiringRisk = await this.getExpiringRisk(organizationId, daysThreshold);
    const expiringValueAtRisk = expiringRisk.reduce(
      (s, e) => s + e.projectedLossValue,
      0,
    );

    // Rankings con DTO completo
    const ranked = allRows.map((r, i) => ({ ...r, rank: i + 1 }));
    const toDto = (r: (typeof ranked)[number]): ProductRotationDto => {
      const c = this.computeRotationRow(data, r.productId);
      return {
        productId: r.productId,
        productName: c.product.name,
        sku: c.product.sku,
        barcode: c.product.barcode,
        isFastSale: c.product.isFastSale,
        categoryId: c.product.categoryId,
        categoryName: c.product.category?.name ?? null,
        unitsSold: r.units,
        revenue: this.r2(r.revenue),
        grossMargin: this.r2(c.grossMargin),
        marginPercent: this.r2(c.marginPercent),
        timesSold: c.s.tickets,
        lastSaleDate: c.lastSaleDate,
        daysSinceLastSale: c.daysSinceLastSale,
        currentStock: r.stock,
        sellThroughRate: this.r2(c.sellThroughRate),
        weeksOfCover:
          c.weeksOfCover != null ? Math.round(c.weeksOfCover * 10) / 10 : null,
        shrinkageUnits: c.sh.units,
        shrinkageValue: this.r2(c.sh.value),
        expiringUnits: c.expiringUnits,
        rank: r.rank,
      };
    };

    const limit = dto.limit && dto.limit > 0 ? dto.limit : 10;
    const purchaseSuggestions = await this.getPurchaseSuggestions(organizationId, {
      startDate: dto.startDate,
      endDate: dto.endDate,
      categoryId: dto.categoryId,
      limit: Math.max(limit, 10),
    });

    return {
      period: { startDate: data.startDate, endDate: data.endDate },
      totals: {
        productsTracked: n,
        unitsSold: totalUnits,
        revenue: this.r2(totalRevenue),
        fastMovers,
        slowMovers,
        outOfStockBestSellers,
        shrinkageValue: this.r2(shrinkageValue),
        expiringValueAtRisk: this.r2(expiringValueAtRisk),
      },
      concentration: {
        top20RevenueShare:
          totalRevenue > 0 ? this.r2((top20Revenue / totalRevenue) * 100) : 0,
        bottom50RevenueShare:
          totalRevenue > 0 ? this.r2((bottom50Revenue / totalRevenue) * 100) : 0,
      },
      rotationBuckets,
      movementCategories,
      topMovers: ranked.slice(0, limit).map(toDto),
      bottomMovers: ranked
        .filter((r) => r.units === 0 || r.weeklyVelocity < 1)
        .slice(-limit)
        .reverse()
        .map(toDto),
      purchaseSuggestions,
    };
  }
}
