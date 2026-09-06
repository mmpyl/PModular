'use client';

import { useEffect, useState } from 'react';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';

type Order = { id: string; orderNumber: string; status: string; total: number | string; supplier?: { name: string } };
type Supplier = { id: string; name: string };

export default function PurchaseOrdersPage() {
  const { token, organizationId } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]); const [suppliers, setSuppliers] = useState<Supplier[]>([]); const [supplierId, setSupplierId] = useState(''); const [error, setError] = useState('');
  const load = async () => { if (!token || !organizationId) return; try { const [orderRows, supplierRows] = await Promise.all([apiFetch<Order[]>('/purchase-orders', { token, organizationId }), apiFetch<Supplier[]>('/business-entities?type=PROVEEDOR', { token, organizationId })]); setOrders(orderRows); setSuppliers(supplierRows); if (!supplierId && supplierRows[0]) setSupplierId(supplierRows[0].id); } catch (e: unknown) { setError(e instanceof ApiError ? e.message : 'No se pudieron cargar las compras'); } };
  useEffect(() => { void load(); }, [organizationId, token]);
  async function createOrder(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (!token || !organizationId || !supplierId) return; try { await apiFetch('/purchase-orders', { method: 'POST', token, organizationId, body: JSON.stringify({ supplierId, items: [] }) }); await load(); } catch (e: unknown) { setError(e instanceof ApiError ? e.message : 'No se pudo crear la orden'); } }
  return <OwnerShell active="purchases"><OwnerHeader eyebrow="Abastecimiento" title="Órdenes de compra" />{error && <p className="error-message">{error}</p>}<section className="content-grid"><article className="panel"><span className="eyebrow">Nueva orden</span><h2>Registrar compra</h2><form className="compact-form" onSubmit={createOrder}><label>Proveedor<select required value={supplierId} onChange={(e) => setSupplierId(e.target.value)}><option value="">Seleccionar...</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label><button type="submit" disabled={!suppliers.length}>Crear orden</button></form><p className="muted">Agrega los productos desde el detalle de la orden.</p></article><article className="panel"><span className="eyebrow">Historial</span><h2>Órdenes recientes</h2>{orders.map((order) => <div className="list-row" key={order.id}><span><strong>{order.orderNumber}</strong><small>{order.supplier?.name || 'Proveedor'} · {order.status}</small></span><strong>{Number(order.total).toFixed(2)}</strong></div>)}{!orders.length && <p className="muted">No hay órdenes registradas.</p>}</article></section></OwnerShell>;
}