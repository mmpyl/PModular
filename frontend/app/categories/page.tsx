'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';

type Category = { id: string; name: string; _count?: { products: number } };

export default function CategoriesPage() {
  const { token, organizationId, orgRole } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  async function loadCategories() {
    if (!token || !organizationId) return;
    try { setCategories(await apiFetch<Category[]>('/categories', { token, organizationId })); } catch (caughtError) { setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudieron cargar las categorías'); }
  }

  useEffect(() => { void loadCategories(); }, [organizationId, token]);

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !organizationId) return;
    try { await apiFetch('/categories', { method: 'POST', token, organizationId, body: JSON.stringify({ name }) }); setName(''); setError(''); await loadCategories(); } catch (caughtError) { setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo crear la categoría'); }
  }

  if (orgRole === 'OWNER') return <ProtectedRoute><section className="panel restricted-panel"><span className="eyebrow">Acceso restringido</span><h1>Categorías gestionadas por el equipo operativo</h1><p>El propietario administra el negocio desde reportes, permisos y configuración.</p></section></ProtectedRoute>;
  return <ProtectedRoute><div className="app-shell"><aside className="sidebar"><strong>PModular</strong><nav><a href="/dashboard">Resumen</a><a href="/products">Productos</a><a className="active" href="/categories">Categorías</a></nav></aside><main className="workspace"><header className="topbar"><div><span className="eyebrow">Catálogo</span><h1>Categorías</h1></div></header><section className="content-grid"><article className="panel"><h2>Nueva categoría</h2><form onSubmit={createCategory} className="compact-form"><label>Nombre<input required value={name} onChange={(event) => setName(event.target.value)} /></label><button type="submit">Agregar categoría</button></form></article><article className="panel"><h2>Categorías activas</h2>{error && <p className="error-message" role="alert">{error}</p>}{categories.map((category) => <div className="list-row" key={category.id}><span>{category.name}</span><small>{category._count?.products ?? 0} productos</small></div>)}{!categories.length && <p className="muted">No hay categorías para mostrar.</p>}</article></section></main></div></ProtectedRoute>;
}