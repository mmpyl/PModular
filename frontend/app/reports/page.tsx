'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError, apiFetch } from '@/lib/api';

type SalesSummary = { totalSales: number; totalRevenue: number; totalTax: number; totalDiscount: number; averageTicket: number };
type InventorySummary = { totalProducts: number; totalItems: number; totalValue: number; lowStockItems: number; outOfStockItems: number; expiringSoonItems: number };
type CashSummary = { totalIncome: number; totalExpenses: number; netBalance: number; totalOpenings?: number; totalClosings?: number; discrepancies?: number };
type PurchaseSummary = { totalPurchases: number; totalSpent: number; totalTax: number; averageOrderValue: number; purchaseCount: number };
type TopProduct = { productId: string; productName: string; sku?: string | null; totalQuantity: number; totalRevenue: number; rank: number };
type SalesCategory = { categoryId: string; categoryName: string; totalQuantity: number; totalRevenue: number; percentage: number };
type SupplierSummary = { supplierId: string; supplierName: string; totalOrders: number; totalSpent: number; percentage: number };
type MovementSummary = { totalIngresses: number; totalExits: number; netBalance: number; movementsByReason: { reason: string; count: number; totalQuantity: number }[] };
type ReportData = { sales: SalesSummary; inventory: InventorySummary; cash: CashSummary; purchases: PurchaseSummary; topProducts: TopProduct[]; categories: SalesCategory[]; suppliers: SupplierSummary[]; movements: MovementSummary };

const today = new Date();
const dateValue = (date: Date) => date.toISOString().slice(0, 10);
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'PEN' });

export default function ReportsPage() {
  const { token, organizationId } = useAuth();
  const [startDate, setStartDate] = useState(dateValue(thirtyDaysAgo));
  const [endDate, setEndDate] = useState(dateValue(today));
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliedRange, setAppliedRange] = useState({ startDate: dateValue(thirtyDaysAgo), endDate: dateValue(today) });

  const load = useCallback(async () => {
    if (!token || !organizationId) return;
    setLoading(true); setError('');
    const params = new URLSearchParams({ startDate: appliedRange.startDate, endDate: appliedRange.endDate });
    try {
      const [sales, inventory, cash, purchases, topProducts, categories, suppliers, movements] = await Promise.all([
        apiFetch<SalesSummary>(`/reports/sales/summary?${params}`, { token, organizationId }),
        apiFetch<InventorySummary>('/reports/inventory/summary', { token, organizationId }),
        apiFetch<CashSummary>(`/reports/cash-register/summary?${params}`, { token, organizationId }),
        apiFetch<PurchaseSummary>(`/reports/purchases/summary?${params}`, { token, organizationId }),
        apiFetch<TopProduct[]>(`/reports/sales/top-products?${params}&limit=8`, { token, organizationId }),
        apiFetch<SalesCategory[]>(`/reports/sales/by-category?${params}`, { token, organizationId }),
        apiFetch<SupplierSummary[]>(`/reports/purchases/by-supplier?${params}`, { token, organizationId }),
        apiFetch<MovementSummary>(`/reports/stock-movements/summary?${params}`, { token, organizationId }),
      ]);
      setData({ sales, inventory, cash, purchases, topProducts, categories, suppliers, movements });
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudieron cargar los reportes');
    } finally { setLoading(false); }
  }, [token, organizationId, appliedRange]);

  useEffect(() => { void load(); }, [load]);

  function applyRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (startDate > endDate) {
      setError('La fecha inicial debe ser anterior a la fecha final.');
      return;
    }
    setAppliedRange({ startDate, endDate });
  }

  return (
    <OwnerShell active="reports">
      <OwnerHeader eyebrow="Administración" title="Reportes del negocio" />
      {error && <p className="error-message" role="alert">{error}</p>}
      <section className="panel report-period-panel">
        <div><span className="eyebrow">Periodo</span><h2>Actividad del negocio</h2></div>
        <form className="report-period-form" onSubmit={applyRange}>
          <label>Desde<input type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label>Hasta<input type="date" required value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
          <button type="submit" disabled={loading}>{loading ? 'Actualizando...' : 'Aplicar periodo'}</button>
        </form>
      </section>

      {loading && !data && <p className="loading-message">Cargando reportes...</p>}
      {data && <>
        <section className="metric-grid report-metrics">
          <article className="metric-card"><span>Ventas confirmadas</span><strong>{data.sales.totalSales}</strong><small>Ticket promedio {currency.format(data.sales.averageTicket)}</small></article>
          <article className="metric-card"><span>Ingresos por ventas</span><strong>{currency.format(data.sales.totalRevenue)}</strong><small>{currency.format(data.sales.totalTax)} en impuestos</small></article>
          <article className="metric-card"><span>Compras registradas</span><strong>{data.purchases.purchaseCount}</strong><small>{currency.format(data.purchases.totalSpent)} · promedio {currency.format(data.purchases.averageOrderValue)}</small></article>
          <article className="metric-card"><span>Inventario valorizado</span><strong>{currency.format(data.inventory.totalValue)}</strong><small>{data.inventory.totalProducts} productos activos · {data.inventory.totalItems} unidades</small></article>
          <article className="metric-card"><span>Balance de caja</span><strong>{currency.format(data.cash.netBalance)}</strong><small>{currency.format(data.cash.totalIncome)} ingresos · {currency.format(data.cash.totalExpenses)} egresos</small></article>
          <article className="metric-card"><span>Alertas de inventario</span><strong>{data.inventory.lowStockItems + data.inventory.outOfStockItems}</strong><small>{data.inventory.lowStockItems} stock bajo · {data.inventory.expiringSoonItems} lotes próximos a vencer</small></article>
        </section>

        <div className="report-grid">
          <section className="panel">
            <div className="panel-heading"><div><span className="eyebrow">Ventas</span><h2>Productos más vendidos</h2></div></div>
            {data.topProducts.map((product) => <div className="list-row" key={product.productId}>
              <span><strong>{product.rank}. {product.productName}</strong><small>{product.sku || 'Sin SKU'} · {product.totalQuantity} unidades</small></span>
              <strong>{currency.format(product.totalRevenue)}</strong>
            </div>)}
            {!data.topProducts.length && <p className="muted">No hay ventas en este periodo.</p>}
          </section>
          <section className="panel">
            <div className="panel-heading"><div><span className="eyebrow">Ventas</span><h2>Ventas por categoría</h2></div></div>
            {data.categories.map((category) => <div className="list-row" key={category.categoryId}>
              <span><strong>{category.categoryName}</strong><small>{category.totalQuantity} unidades · {category.percentage.toFixed(1)}%</small></span>
              <strong>{currency.format(category.totalRevenue)}</strong>
            </div>)}
            {!data.categories.length && <p className="muted">No hay categorías con ventas en este periodo.</p>}
          </section>
          <section className="panel">
            <div className="panel-heading"><div><span className="eyebrow">Abastecimiento</span><h2>Compras por proveedor</h2></div></div>
            {data.suppliers.map((supplier) => <div className="list-row" key={supplier.supplierId}>
              <span><strong>{supplier.supplierName}</strong><small>{supplier.totalOrders} órdenes · {supplier.percentage.toFixed(1)}% del gasto</small></span>
              <strong>{currency.format(supplier.totalSpent)}</strong>
            </div>)}
            {!data.suppliers.length && <p className="muted">No hay compras en este periodo.</p>}
          </section>
          <section className="panel">
            <div className="panel-heading"><div><span className="eyebrow">Inventario</span><h2>Movimientos de stock</h2></div></div>
            <div className="list-row"><span><strong>Entradas</strong><small>Unidades ingresadas</small></span><strong className="inventory-positive">+{data.movements.totalIngresses}</strong></div>
            <div className="list-row"><span><strong>Salidas</strong><small>{data.movements.totalExits} movimientos</small></span><strong className="inventory-negative">-{data.movements.totalExits}</strong></div>
            {data.movements.movementsByReason.slice(0, 5).map((movement) => <div className="list-row" key={movement.reason}>
              <span><strong>{movement.reason.replaceAll('_', ' ')}</strong><small>{movement.count} movimientos</small></span><strong>{movement.totalQuantity}</strong>
            </div>)}
          </section>
        </div>
      </>}
    </OwnerShell>
  );
}