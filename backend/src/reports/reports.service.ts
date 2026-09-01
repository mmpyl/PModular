import { Injectable, BadRequestException } from '@nestjs/common';
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
} from './dto/reports.dto';
import { MovementType, MovementReason } from '@prisma/client';

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
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    const productIds = result.map((r) => r.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        sku: true,
      },
    });

    return result.map((item, index) => {
      const product = products.find((p) => p.id === item.productId)!;
      return {
        productId: item.productId,
        productName: product.name,
        sku: product.sku,
        totalQuantity: Number(item._sum.quantity || 0),
        totalRevenue: Number(item._sum.total || 0),
        rank: index + 1,
      };
    });
  }

  /**
   * Resumen general de inventario
   */
  async getInventorySummary(organizationId: string): Promise<InventorySummaryDto> {
    // Total de productos activos
    const totalProducts = await this.prisma.product.count({
      where: {
        organizationId,
        isActive: true,
      },
    });

    // Items de inventario
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: { organizationId },
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
  ): Promise<InventoryByCategoryDto[]> {
    const products = await this.prisma.product.findMany({
      where: {
        organizationId,
        isActive: true,
      },
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
   * Productos con stock bajo
   */
  async getLowStockProducts(
    organizationId: string,
    threshold: number = 10,
  ): Promise<LowStockDto[]> {
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: {
        organizationId,
        quantity: {
          lte: threshold,
        },
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

    return inventoryItems.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      sku: item.product.sku,
      currentQuantity: Number(item.quantity),
      unitName: item.product.unit?.name,
      batches: item.batches.map((batch) => ({
        batchId: batch.id,
        quantity: Number(batch.currentQuantity),
        expirationDate: batch.expirationDate || undefined,
      })),
    }));
  }
}
