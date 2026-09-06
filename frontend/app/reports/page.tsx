'use client';

import { useEffect, useState } from 'react';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';

type Reports = { sales: { totalSales: number; totalRevenue: number; averageTicket: number }; inventory: { totalProducts: number; totalValue: number; lowStockItems: number; expiringSoonItems: number }; cash: { totalIncome: number; totalExpenses: number; netBalance: number } };
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' });

export default function ReportsPage() {
  const { token, organizationId } = useAuth(); const [data, setData] = useState<Reports | null>(null); const [error, setError] = useState('');
  useEffect(() => { if (!token || !organizationId) return; Promise.all([apiFetch<Reports['sales']>('/reports/sales/summary', { token, organizationId }), apiFetch<Reports['inventory']>('/reports/inventory/summary', { token, organizationId }), apiFetch<Reports['cash']>('/reports/cash-register/summary', { token, organizationId })]).then(([sales, inventory, cash]) => setData({ sales, inventory, cash })).catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'No se pudieron cargar los reportes')); }, [organizationId, token]);
  return <OwnerShell active="reports"><OwnerHeader eyebrow="Administración" title="Reportes del negocio" />{error && <p className="error-message">{error}</p>}{!data && !error && <p className="loading-message">Cargando reportes...</p>}{data && <section className="metric-grid"><article className="metric-card"><span>Ventas registradas</span><strong>{data.sales.totalSales}</strong><small>Promedio: {money.format(data.sales.averageTicket)}</small></article><article className="metric-card"><span>Ingresos por ventas</span><strong>{money.format(data.sales.totalRevenue)}</strong></article><article className="metric-card"><span>Valor del inventario</span><strong>{money.format(data.inventory.totalValue)}</strong><small>{data.inventory.totalProducts} productos</small></article><article className="metric-card"><span>Balance de caja</span><strong>{money.format(data.cash.netBalance)}</strong><small>{data.cash.totalIncome} ingresos · {data.cash.totalExpenses} egresos</small></article></section>}</OwnerShell>;
}