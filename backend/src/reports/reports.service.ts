import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export enum ReportType {
  VENTAS_DIARIAS = 'VENTAS_DIARIAS',
  VENTAS_MENSUALES = 'VENTAS_MENSUALES',
  TOP_PRODUCTOS = 'TOP_PRODUCTOS',
  ROTACION_INVENTARIO = 'ROTACION_INVENTARIO',
  STOCK_POR_VENCER = 'STOCK_POR_VENCER',
  COMPRAS_PROVEEDORES = 'COMPRAS_PROVEEDORES',
  FLUJO_CAJA = 'FLUJO_CAJA',
  PRODUCTOS_MAS_VENDIDOS = 'PRODUCTOS_MAS_VENDIDOS',
  TICKET_PROMEDIO = 'TICKET_PROMEDIO',
}

export enum ReportPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export interface SalesDailyReport {
  totalVentas: number;
  totalItems: number;
  ticketPromedio: number;
  ventasEfectivo: number;
  ventasTarjeta: number;
  ventasOtros: number;
  horaPico: string;
  topProductos: Array<{ productId: string; productName: string; quantity: number; total: number }>;
}

export interface TopProductsReport {
  products: Array<{
    productId: string;
    productName: string;
    categoryId?: string;
    quantitySold: number;
    totalRevenue: number;
    averagePrice: number;
  }>;
  periodStart: Date;
  periodEnd: Date;
}

export interface InventoryTurnoverReport {
  items: Array<{
    productId: string;
    productName: string;
    sku?: string;
    currentStock: number;
    averageStock: number;
    costOfGoodsSold: number;
    turnoverRatio: number;
    daysToSell: number;
  }>;
  organizationId: string;
  periodDays: number;
}

export interface ExpiringStockReport {
  batches: Array<{
    batchId: string;
    productId: string;
    productName: string;
    batchNumber: string;
    expirationDate: Date;
    currentQuantity: number;
    unitCost: number;
    totalValue: number;
    daysUntilExpiration: number;
  }>;
  totalValue: number;
}

export interface SupplierPurchasesReport {
  suppliers: Array<{
    supplierId: string;
    supplierName: string;
    totalPurchases: number;
    ordersCount: number;
    averageOrderValue: number;
    lastPurchaseDate: Date;
  }>;
  periodStart: Date;
  periodEnd: Date;
  totalSpent: number;
}

export interface CashFlowReport {
  inflows: Array<{
    date: string;
    amount: number;
    source: string;
    method: string;
  }>;
  outflows: Array<{
    date: string;
    amount: number;
    description: string;
    type: string;
  }>;
  netFlow: number;
  totalInflows: number;
  totalOutflows: number;
  openingBalance: number;
  closingBalance: number;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Reporte de Ventas Diarias
   */
  async getDailySalesReport(organizationId: string, date: Date): Promise<SalesDailyReport> {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    // Obtener todas las ventas completadas del día
    const sales = await this.prisma.sale.findMany({
      where: {
        organizationId,
        status: 'COMPLETADA',
        saleDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
    });

    let totalVentas = 0;
    let totalItems = 0;
    let ventasEfectivo = 0;
    let ventasTarjeta = 0;
    let ventasOtros = 0;
    const productSales: Record<string, { quantity: number; total: number; name: string }> = {};
    const hourSales: Record<number, number> = {};

    sales.forEach((sale) => {
      totalVentas += Number(sale.total);
      
      // Contar items
      sale.items.forEach((item) => {
        totalItems += Number(item.quantity);
        
        // Acumular por producto
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            quantity: 0,
            total: 0,
            name: item.product.name,
          };
        }
        productSales[item.productId].quantity += Number(item.quantity);
        productSales[item.productId].total += Number(item.total);
      });

      // Clasificar pagos por método
      sale.payments.forEach((payment) => {
        const amount = Number(payment.amount);
        if (payment.method === 'EFECTIVO') {
          ventasEfectivo += amount;
        } else if (payment.method === 'TARJETA_CREDITO' || payment.method === 'TARJETA_DEBITO') {
          ventasTarjeta += amount;
        } else {
          ventasOtros += amount;
        }
      });

      // Hora de la venta para hora pico
      const hour = sale.saleDate.getHours();
      hourSales[hour] = (hourSales[hour] || 0) + 1;
    });

    // Encontrar hora pico
    let horaPico = 'N/A';
    let maxVentas = 0;
    Object.entries(hourSales).forEach(([hour, count]) => {
      if (count > maxVentas) {
        maxVentas = count;
        horaPico = `${hour}:00 - ${hour}:59`;
      }
    });

    // Top productos
    const topProductos = Object.entries(productSales)
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        quantity: data.quantity,
        total: data.total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return {
      totalVentas,
      totalItems,
      ticketPromedio: sales.length > 0 ? totalVentas / sales.length : 0,
      ventasEfectivo,
      ventasTarjeta,
      ventasOtros,
      horaPico,
      topProductos,
    };
  }

  /**
   * Reporte de Productos Más Vendidos
   */
  async getTopProductsReport(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 20,
  ): Promise<TopProductsReport> {
    const sales = await this.prisma.sale.findMany({
      where: {
        organizationId,
        status: 'COMPLETADA',
        saleDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    const productStats: Record<
      string,
      {
        quantity: number;
        revenue: number;
        name: string;
        categoryId?: string;
        prices: number[];
      }
    > = {};

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            quantity: 0,
            revenue: 0,
            name: item.product.name,
            categoryId: item.product.categoryId ?? undefined,
            prices: [],
          };
        }
        productStats[item.productId].quantity += Number(item.quantity);
        productStats[item.productId].revenue += Number(item.total);
        productStats[item.productId].prices.push(Number(item.unitPrice));
      });
    });

    const products = Object.entries(productStats)
      .map(([productId, stats]) => ({
        productId,
        productName: stats.name,
        categoryId: stats.categoryId,
        quantitySold: stats.quantity,
        totalRevenue: stats.revenue,
        averagePrice: stats.prices.length > 0 
          ? stats.prices.reduce((a, b) => a + b, 0) / stats.prices.length 
          : 0,
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, limit);

    return {
      products,
      periodStart: startDate,
      periodEnd: endDate,
    };
  }

  /**
   * Reporte de Rotación de Inventario
   */
  async getInventoryTurnoverReport(
    organizationId: string,
    days: number = 30,
  ): Promise<InventoryTurnoverReport> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Obtener todos los items de inventario
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: { organizationId },
      include: {
        product: true,
      },
    });

    // Obtener movimientos de stock en el período
    const movements = await this.prisma.stockMovement.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        type: 'SALIDA',
      },
      include: {
        product: true,
      },
    });

    // Calcular COGS y rotación por producto
    const productMovements: Record<string, { cogs: number; quantities: number[] }> = {};
    
    movements.forEach((movement) => {
      if (!productMovements[movement.productId]) {
        productMovements[movement.productId] = { cogs: 0, quantities: [] };
      }
      
      // Asumir que el costo es el averageCost del inventario
      const quantity = Number(movement.quantity);
      productMovements[movement.productId].quantities.push(quantity);
    });

    const items = inventoryItems.map((item) => {
      const movementData = productMovements[item.productId] || { cogs: 0, quantities: [] };
      const totalSold = movementData.quantities.reduce((a, b) => a + b, 0);
      const avgStock = Number(item.quantity);
      const cogs = totalSold * Number(item.averageCost);
      
      // Rotación = COGS / Stock Promedio
      const turnoverRatio = avgStock > 0 ? cogs / (avgStock * Number(item.averageCost)) : 0;
      const daysToSell = turnoverRatio > 0 ? days / turnoverRatio : Infinity;

      return {
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku ?? undefined,
        currentStock: Number(item.quantity),
        averageStock: avgStock,
        costOfGoodsSold: cogs,
        turnoverRatio,
        daysToSell: daysToSell === Infinity ? -1 : Math.round(daysToSell),
      };
    });

    return {
      items,
      organizationId,
      periodDays: days,
    };
  }

  /**
   * Reporte de Stock por Vencer
   */
  async getExpiringStockReport(
    organizationId: string,
    daysThreshold: number = 30,
  ): Promise<ExpiringStockReport> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    const batches = await this.prisma.batch.findMany({
      where: {
        organizationId,
        status: 'ACTIVO',
        expirationDate: {
          lte: thresholdDate,
        },
        currentQuantity: {
          gt: new Decimal(0),
        },
      },
      include: {
        product: true,
      },
      orderBy: {
        expirationDate: 'asc',
      },
    });

    const today = new Date();
    let totalValue = 0;

    const reportBatches = batches.map((batch) => {
      const daysUntilExpiration = Math.ceil(
        (batch.expirationDate!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      const totalValueBatch = Number(batch.currentQuantity) * Number(batch.unitCost);
      totalValue += totalValueBatch;

      return {
        batchId: batch.id,
        productId: batch.productId,
        productName: batch.product.name,
        batchNumber: batch.batchNumber,
        expirationDate: batch.expirationDate!,
        currentQuantity: Number(batch.currentQuantity),
        unitCost: Number(batch.unitCost),
        totalValue: totalValueBatch,
        daysUntilExpiration,
      };
    });

    return {
      batches: reportBatches,
      totalValue,
    };
  }

  /**
   * Reporte de Compras por Proveedor
   */
  async getSupplierPurchasesReport(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SupplierPurchasesReport> {
    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      where: {
        organizationId,
        status: {
          in: ['COMPLETADA', 'PARCIALMENTE_RECIBIDA'],
        },
        orderDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        supplier: true,
      },
    });

    const supplierStats: Record<
      string,
      {
        total: number;
        orders: number;
        lastDate: Date;
        name: string;
      }
    > = {};

    let totalSpent = 0;

    purchaseOrders.forEach((order) => {
      if (!supplierStats[order.supplierId]) {
        supplierStats[order.supplierId] = {
          total: 0,
          orders: 0,
          lastDate: order.orderDate,
          name: order.supplier.name,
        };
      }
      
      supplierStats[order.supplierId].total += Number(order.total);
      supplierStats[order.supplierId].orders += 1;
      
      if (order.orderDate > supplierStats[order.supplierId].lastDate) {
        supplierStats[order.supplierId].lastDate = order.orderDate;
      }
      
      totalSpent += Number(order.total);
    });

    const suppliers = Object.entries(supplierStats).map(([supplierId, stats]) => ({
      supplierId,
      supplierName: stats.name,
      totalPurchases: stats.total,
      ordersCount: stats.orders,
      averageOrderValue: stats.orders > 0 ? stats.total / stats.orders : 0,
      lastPurchaseDate: stats.lastDate,
    }));

    return {
      suppliers: suppliers.sort((a, b) => b.totalPurchases - a.totalPurchases),
      periodStart: startDate,
      periodEnd: endDate,
      totalSpent,
    };
  }

  /**
   * Reporte de Flujo de Caja
   */
  async getCashFlowReport(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CashFlowReport> {
    // Obtener pagos recibidos (inflows)
    const payments = await this.prisma.payment.findMany({
      where: {
        organizationId,
        status: 'PAGADO',
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        paymentDate: 'asc',
      },
    });

    // Obtener movimientos de caja (outflows)
    const cashMovements = await this.prisma.cashRegisterMovement.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isPositive: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const inflows = payments.map((payment) => ({
      date: payment.paymentDate.toISOString().split('T')[0],
      amount: Number(payment.amount),
      source: payment.referenceType === 'SALE' ? 'Venta' : 'Pago Compra',
      method: payment.method,
    }));

    const outflows = cashMovements.map((movement) => ({
      date: movement.createdAt.toISOString().split('T')[0],
      amount: Number(movement.amount),
      description: movement.description,
      type: movement.type,
    }));

    const totalInflows = inflows.reduce((sum, i) => sum + i.amount, 0);
    const totalOutflows = outflows.reduce((sum, o) => sum + o.amount, 0);
    const netFlow = totalInflows - totalOutflows;

    // Balance inicial (antes del período)
    const previousPayments = await this.prisma.payment.aggregate({
      where: {
        organizationId,
        status: 'PAGADO',
        paymentDate: { lt: startDate },
      },
      _sum: { amount: true },
    });

    const openingBalance = Number(previousPayments._sum.amount || 0);
    const closingBalance = openingBalance + netFlow;

    return {
      inflows,
      outflows,
      netFlow,
      totalInflows,
      totalOutflows,
      openingBalance,
      closingBalance,
    };
  }

  /**
   * Guardar reporte en caché
   */
  async cacheReport(
    organizationId: string,
    reportType: ReportType,
    period: ReportPeriod,
    referenceDate: Date,
    data: any,
    expiresAt?: Date,
  ): Promise<void> {
    await this.prisma.reportCache.upsert({
      where: {
        organizationId_reportType_period_referenceDate: {
          organizationId,
          reportType,
          period,
          referenceDate,
        },
      },
      update: {
        data,
        expiresAt,
      },
      create: {
        organizationId,
        reportType,
        period,
        referenceDate,
        data,
        expiresAt,
      },
    });
  }

  /**
   * Obtener reporte desde caché
   */
  async getCachedReport<T>(
    organizationId: string,
    reportType: ReportType,
    period: ReportPeriod,
    referenceDate: Date,
  ): Promise<T | null> {
    const cached = await this.prisma.reportCache.findUnique({
      where: {
        organizationId_reportType_period_referenceDate: {
          organizationId,
          reportType,
          period,
          referenceDate,
        },
      },
    });

    if (!cached) {
      return null;
    }

    // Verificar si expiró
    if (cached.expiresAt && cached.expiresAt < new Date()) {
      await this.prisma.reportCache.delete({
        where: { id: cached.id },
      });
      return null;
    }

    return cached.data as T;
  }

  /**
   * Limpiar reportes expirados
   */
  async clearExpiredReports(): Promise<number> {
    const result = await this.prisma.reportCache.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }
}
