'use client';

import { useEffect, useState } from 'react';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Reports = { sales: { totalSales: number; totalRevenue: number; averageTicket: number }; inventory: { totalProducts: number; totalValue: number; lowStockItems: number; expiringSoonItems: number }; cash: { totalIncome: number; totalExpenses: number; netBalance: number } };
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' });

export default function ReportsPage() {
  const { token, organizationId } = useAuth(); const [data, setData] = useState<Reports | null>(null); const [error, setError] = useState('');
  useEffect(() => { if (!token || !organizationId) return; Promise.all([apiFetch<Reports['sales']>('/reports/sales/summary', { token, organizationId }), apiFetch<Reports['inventory']>('/reports/inventory/summary', { token, organizationId }), apiFetch<Reports['cash']>('/reports/cash-register/summary', { token, organizationId })]).then(([sales, inventory, cash]) => setData({ sales, inventory, cash })).catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'No se pudieron cargar los reportes')); }, [organizationId, token]);
  return <OwnerShell active="reports"><OwnerHeader eyebrow="Administración" title="Reportes del negocio" />{error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}{!data && !error && <p className="text-muted-foreground">Cargando reportes...</p>}{data && <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><Card><CardHeader><p className="text-sm font-medium text-muted-foreground">Ventas registradas</p><p className="text-3xl font-bold">{data.sales.totalSales}</p><p className="text-xs text-muted-foreground">Promedio: {money.format(data.sales.averageTicket)}</p></CardHeader></Card><Card><CardHeader><p className="text-sm font-medium text-muted-foreground">Ingresos por ventas</p><p className="text-3xl font-bold">{money.format(data.sales.totalRevenue)}</p></CardHeader></Card><Card><CardHeader><p className="text-sm font-medium text-muted-foreground">Valor del inventario</p><p className="text-3xl font-bold">{money.format(data.inventory.totalValue)}</p><p className="text-xs text-muted-foreground">{data.inventory.totalProducts} productos</p></CardHeader></Card><Card><CardHeader><p className="text-sm font-medium text-muted-foreground">Balance de caja</p><p className="text-3xl font-bold">{money.format(data.cash.netBalance)}</p><p className="text-xs text-muted-foreground">{data.cash.totalIncome} ingresos · {data.cash.totalExpenses} egresos</p></CardHeader></Card></div>}</OwnerShell>;
}