'use client';

import { FormEvent, useEffect, useState } from 'react';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';

type Product = { id: string; name: string; price: number | string };
type Sale = { id: string; saleNumber: string; status: string; total: number | string; saleDate: string };

export default function SalesPage() {
  const { token, organizationId } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');
  const load = async () => { if (!token || !organizationId) return; try { const [saleRows, productRows] = await Promise.all([apiFetch<Sale[]>('/sales', { token, organizationId }), apiFetch<Product[]>('/products', { token, organizationId })]); setSales(saleRows); setProducts(productRows); if (!productId && productRows[0]) setProductId(productRows[0].id); } catch (e: unknown) { setError(e instanceof ApiError ? e.message : 'No se pudieron cargar las ventas'); } };
  useEffect(() => { void load(); }, [organizationId, token]);
  async function createSale(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!token || !organizationId || !productId) return; const product = products.find((item) => item.id === productId); try { await apiFetch('/sales', { method: 'POST', token, organizationId, body: JSON.stringify({ items: [{ productId, quantity: Number(quantity), unitPrice: Number(product?.price || 0) }] }) }); await load(); } catch (e: unknown) { setError(e instanceof ApiError ? e.message : 'No se pudo registrar la venta'); } }
  return <OwnerShell active="sales"><OwnerHeader eyebrow="Operación" title="Ventas" />{error && <p className="error-message">{error}</p>}<section className="content-grid"><article className="panel"><span className="eyebrow">Nueva operación</span><h2>Registrar venta</h2><form className="compact-form" onSubmit={createSale}><label>Producto<select value={productId} onChange={(e) => setProductId(e.target.value)}>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label>Cantidad<input min="1" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></label><button type="submit" disabled={!products.length}>Registrar venta</button></form></article><article className="panel"><span className="eyebrow">Historial</span><h2>Ventas recientes</h2>{sales.map((sale) => <div className="list-row" key={sale.id}><span><strong>{sale.saleNumber}</strong><small>{new Date(sale.saleDate).toLocaleDateString('es-MX')} · {sale.status}</small></span><strong>{Number(sale.total).toFixed(2)}</strong></div>)}{!sales.length && <p className="muted">No hay ventas registradas.</p>}</article></section></OwnerShell>;
}