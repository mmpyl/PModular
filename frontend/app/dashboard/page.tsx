'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';

type DashboardMetrics = {
  sales: { today: number; thisMonth: number };
  revenue: { today: number; thisMonth: number };
  inventory: { totalValue: number; lowStockAlerts: number };
  customers: { total: number; activeThisMonth: number };
  topProducts: { productName: string; totalQuantity: number; totalRevenue: number }[];
};

type InventorySummary = { totalProducts: number; totalValue: number; lowStockItems: number; expiringSoonItems: number };
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' });

export default function DashboardPage() {
  const { token, organizationId, orgRole, user, logout, activeMembership, enabledModules } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [inventory, setInventory] = useState<InventorySummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !organizationId) return;
    const load = async () => {
      try {
        setError('');
        if (orgRole === 'INVENTARIO') {
          setInventory(await apiFetch<InventorySummary>('/reports/inventory/summary', { token, organizationId }));
        } else {
          setMetrics(await apiFetch<DashboardMetrics>('/reports/dashboard/metrics', { token, organizationId }));
        }
      } catch (caughtError) {
        setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudieron cargar las métricas');
      }
    };
    void load();
  }, [organizationId, orgRole, token]);

    return (
      <ProtectedRoute>
        <div className="app-shell">
          <aside className="sidebar">
            <div><strong>PModular</strong><span>Gestión empresarial</span></div>
            <nav><Link className="active" href="/dashboard">Resumen</Link>{orgRole !== 'OWNER' && enabledModules.includes('inventario') && <><Link href="/products">Productos</Link><Link href="/categories">Categorías</Link><Link href="/inventory">Inventario</Link></>}{orgRole !== 'OWNER' && enabledModules.includes('ventas') && <Link href="/sales">Ventas</Link>}{orgRole !== 'OWNER' && enabledModules.includes('caja') && <Link href="/cash-registers">Caja</Link>}{(orgRole === 'OWNER' || orgRole === 'ADMIN') && <><Link href="/team">Equipo</Link><Link href="/reports">Reportes</Link></>}{orgRole === 'OWNER' && <Link href="/business-settings">Configuración</Link>}</nav>
            <button type="button" className="quiet-button" onClick={logout}>Cerrar sesión</button>
          </aside>
          <main className="workspace">
            <header className="topbar"><div><span className="eyebrow">{activeMembership?.organization.businessType?.name || 'Negocio'} · Panel de control</span><h1>Buenos días, {user?.name || user?.email}</h1><p className="muted">{activeMembership?.organization.name}</p></div><span className="role-badge">{orgRole === 'OWNER' ? 'Propietario' : orgRole}</span></header>
            {error && <p className="error-message" role="alert">{error}</p>}
            {!metrics && !inventory && !error && <p className="loading-message">Cargando actividad...</p>}
            {metrics && <>
              <section className="metric-grid">
                <article className="metric-card"><span>Ventas de hoy</span><strong>{metrics.sales.today}</strong><small>{money.format(metrics.revenue.today)}</small></article>
                <article className="metric-card"><span>Ventas del mes</span><strong>{metrics.sales.thisMonth}</strong><small>{money.format(metrics.revenue.thisMonth)}</small></article>
                <article className="metric-card"><span>Valor del inventario</span><strong>{money.format(metrics.inventory.totalValue)}</strong><small>{metrics.inventory.lowStockAlerts} alertas de stock</small></article>
                <article className="metric-card"><span>Clientes activos</span><strong>{metrics.customers.activeThisMonth}</strong><small>{metrics.customers.total} registrados</small></article>
              </section>
              <section className="content-grid"><article className="panel"><div className="panel-heading"><div><span className="eyebrow">Rendimiento</span><h2>Productos más vendidos</h2></div>{orgRole !== 'OWNER' && <Link href="/products">Ver catálogo</Link>}</div>{metrics.topProducts.length ? metrics.topProducts.map((product) => <div className="list-row" key={product.productName}><span>{product.productName}</span><strong>{product.totalQuantity} uds. · {money.format(product.totalRevenue)}</strong></div>) : <p className="muted">Todavía no hay ventas registradas.</p>}</article><article className="panel accent-panel"><span className="eyebrow">Administración</span><h2>Control del negocio</h2><p>Consulta resultados, permisos y configuración de tu organización.</p><Link className="primary-link" href="/reports">Abrir reportes</Link></article></section>
            </>}
            {inventory && <section className="metric-grid"><article className="metric-card"><span>Productos</span><strong>{inventory.totalProducts}</strong></article><article className="metric-card"><span>Valor total</span><strong>{money.format(inventory.totalValue)}</strong></article><article className="metric-card"><span>Stock bajo</span><strong>{inventory.lowStockItems}</strong></article><article className="metric-card"><span>Próximos a vencer</span><strong>{inventory.expiringSoonItems}</strong></article></section>}
            <section className="panel module-strip"><span className="eyebrow">Configuración del negocio</span><h2>Módulos activos</h2><div className="module-list">{enabledModules.map((module) => <span className="module-chip" key={module}>{module}</span>)}</div><p className="muted">{orgRole === 'OWNER' ? 'El propietario administra permisos y módulos según el tipo de negocio.' : 'El administrador opera los módulos habilitados para este negocio.'}</p></section>
          </main>
        </div>
      </ProtectedRoute>
    );
}
