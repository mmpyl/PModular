'use client';

import { useEffect, useState } from 'react';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';

type InventoryItem = { id: string; quantity: number | string; reserved: number | string; averageCost: number | string; product: { name: string; sku?: string | null } };

export default function InventoryPage() {
  const { token, organizationId } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { if (!token || !organizationId) return; void apiFetch<InventoryItem[]>('/inventory', { token, organizationId }).then(setItems).catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'No se pudo cargar el inventario')); }, [organizationId, token]);
  return <OwnerShell active="inventory"><OwnerHeader eyebrow="Control operativo" title="Inventario" />{error && <p className="error-message">{error}</p>}<section className="panel"><div className="panel-heading"><div><span className="eyebrow">Existencias</span><h2>Stock por producto</h2></div><span className="role-badge">{items.length} registros</span></div>{items.map((item) => <div className="list-row" key={item.id}><span><strong>{item.product.name}</strong><small>{item.product.sku || 'Sin SKU'} · Reservado: {item.reserved}</small></span><strong>{item.quantity} uds.</strong></div>)}{!items.length && !error && <p className="muted">No hay existencias registradas todavía.</p>}</section></OwnerShell>;
}