"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let ReportsService = class ReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    getDateRange(dto) {
        const endDate = dto.endDate ? new Date(dto.endDate) : new Date();
        const startDate = dto.startDate
            ? new Date(dto.startDate)
            : new Date(new Date().setMonth(endDate.getMonth() - 1));
        if (startDate > endDate) {
            throw new common_1.BadRequestException('Start date must be before end date');
        }
        return { startDate, endDate };
    }
    async getSalesSummary(organizationId, dto) {
        const { startDate, endDate } = this.getDateRange(dto);
        const where = {
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
        const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
        const totalTax = sales.reduce((sum, sale) => sum + Number(sale.taxAmount), 0);
        const totalDiscount = sales.reduce((sum, sale) => sum + Number(sale.discount), 0);
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
    async getSalesByCategory(organizationId, dto) {
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
        const productIds = result.map((r) => r.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
            include: {
                category: true,
            },
        });
        const categoryMap = new Map();
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
            const category = categoryMap.get(categoryId);
            category.totalQuantity += Number(item._sum.quantity || 0);
            category.totalRevenue += Number(item._sum.total || 0);
        });
        const grandTotal = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.totalRevenue, 0);
        return Array.from(categoryMap.values()).map((cat) => ({
            ...cat,
            percentage: grandTotal > 0 ? (cat.totalRevenue / grandTotal) * 100 : 0,
        }));
    }
    async getTopProducts(organizationId, dto, limit = 10) {
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
        const totals = new Map();
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
    async getInventorySummary(organizationId) {
        const totalProducts = await this.prisma.product.count({
            where: {
                organizationId,
                isActive: true,
            },
        });
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
        const totalItems = inventoryItems.reduce((sum, item) => sum + Number(item.quantity), 0);
        const totalValue = inventoryItems.reduce((sum, item) => sum + Number(item.quantity) * Number(item.averageCost), 0);
        const lowStockItems = inventoryItems.filter((item) => Number(item.quantity) <= 10 && Number(item.quantity) > 0).length;
        const outOfStockItems = inventoryItems.filter((item) => Number(item.quantity) <= 0).length;
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
    async getInventoryByCategory(organizationId) {
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
        const categoryMap = new Map();
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
            const category = categoryMap.get(categoryId);
            category.productCount += 1;
            product.inventory.forEach((inv) => {
                category.totalQuantity += Number(inv.quantity);
                category.totalValue += Number(inv.quantity) * Number(inv.averageCost);
            });
        });
        return Array.from(categoryMap.values());
    }
    async getStockMovementSummary(organizationId, dto) {
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
        const reasonMap = new Map();
        movements.forEach((movement) => {
            if (movement.isPositive) {
                totalIngresses += Number(movement.quantity);
            }
            else {
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
            const reasonData = reasonMap.get(reasonKey);
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
    async getPurchaseSummary(organizationId, dto) {
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
        const totalSpent = purchases.reduce((sum, purchase) => sum + Number(purchase.total), 0);
        const totalTax = purchases.reduce((sum, purchase) => sum + Number(purchase.taxAmount), 0);
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
    async getPurchasesBySupplier(organizationId, dto) {
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
        const grandTotal = result.reduce((sum, r) => sum + Number(r._sum.total || 0), 0);
        return result.map((item) => {
            const supplier = suppliers.find((s) => s.id === item.supplierId);
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
    async getCashRegisterSummary(organizationId, dto) {
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
                    }
                    else {
                        totalExpenses += Number(movement.amount);
                    }
            }
        });
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
        const discrepancies = cashRegisters.reduce((sum, reg) => sum + Math.abs(Number(reg.difference || 0)), 0);
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
    async getDashboardMetrics(organizationId) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        const salesToday = await this.prisma.sale.aggregate({
            where: {
                organizationId,
                saleDate: { gte: today },
                status: { in: ['CONFIRMADA', 'COMPLETADA'] },
            },
            _sum: { total: true },
            _count: { id: true },
        });
        const salesWeek = await this.prisma.sale.aggregate({
            where: {
                organizationId,
                saleDate: { gte: weekAgo },
                status: { in: ['CONFIRMADA', 'COMPLETADA'] },
            },
            _sum: { total: true },
            _count: { id: true },
        });
        const salesMonth = await this.prisma.sale.aggregate({
            where: {
                organizationId,
                saleDate: { gte: monthAgo },
                status: { in: ['CONFIRMADA', 'COMPLETADA'] },
            },
            _sum: { total: true },
            _count: { id: true },
        });
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
        const growth = revenuePreviousWeek > 0
            ? ((revenueWeek - revenuePreviousWeek) / revenuePreviousWeek) * 100
            : 0;
        const inventorySummary = await this.getInventorySummary(organizationId);
        const topProducts = await this.getTopProducts(organizationId, {
            startDate: monthAgo.toISOString(),
            endDate: now.toISOString(),
        });
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
    async getExpiringBatches(organizationId, daysThreshold = 30) {
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
            const daysUntilExpiration = Math.ceil((batch.expirationDate.getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24));
            return {
                batchId: batch.id,
                productId: batch.productId,
                productName: batch.product.name,
                batchNumber: batch.batchNumber,
                expirationDate: batch.expirationDate,
                currentQuantity: Number(batch.currentQuantity),
                daysUntilExpiration,
            };
        });
    }
    async getLowStockProducts(organizationId, threshold = 10) {
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
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map