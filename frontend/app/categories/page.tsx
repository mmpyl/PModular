'use client';

import { FormEvent, useEffect, useState } from 'react';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { RequireRole } from '@/components/RequireRole';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';

type Category = {
  id: string;
  name: string;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  _count?: { products: number };
};

// Crear/editar: OWNER/ADMIN/INVENTARIO. Eliminar: solo OWNER/ADMIN (backend).
const WRITE_ROLES = ['OWNER', 'ADMIN', 'INVENTARIO'];
const DELETE_ROLES = ['OWNER', 'ADMIN'];

export default function CategoriesPage() {
  const { token, organizationId } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadCategories() {
    if (!token || !organizationId) return;
    try {
      const rows = await apiFetch<Category[]>('/categories', { token, organizationId });
      setCategories(rows);
      if (parentId && !rows.some((c) => c.id === parentId)) setParentId('');
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudieron cargar las categorías');
    }
  }

  useEffect(() => { void loadCategories(); }, [token, organizationId]);

  function resetForm() { setName(''); setParentId(''); setEditingId(null); setMessage(''); }

  function startEdit(category: Category) {
    setEditingId(category.id); setName(category.name); setParentId(category.parentId ?? '');
    setMessage(''); setError('');
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !organizationId) return;
    const body = JSON.stringify({ name, parentId: parentId || null });
    try {
      if (editingId) {
        await apiFetch(`/categories/${editingId}`, { method: 'PATCH', token, organizationId, body });
        setMessage('Categoría actualizada correctamente');
      } else {
        await apiFetch('/categories', { method: 'POST', token, organizationId, body });
        setMessage('Categoría creada correctamente');
      }
      setError(''); resetForm(); await loadCategories();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo guardar la categoría');
    }
  }

  async function deleteCategory(categoryV: Category) {
    if (!token || !organizationId) return;
    if (!window.confirm(`¿Eliminar la categoría "${categoryV.name}"?`)) return;
    try {
      await apiFetch(`/categories/${categoryV.id}`, { method: 'DELETE', token, organizationId });
      setMessage(`Categoría "${categoryV.name}" eliminada`); setError('');
      await loadCategories();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo eliminar la categoría');
    }
  }

  const roots = categories.filter((c) => !c.parentId);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);

  return (
    <OwnerShell active="categories">
      <OwnerHeader eyebrow="Catálogo" title="Categorías" />
      {error && <p className="error-message" role="alert">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      <RequireRole roles={WRITE_ROLES}>
        <section className="panel">
          <span className="eyebrow">{editingId ? 'Edición' : 'Alta'}</span>
          <h2>{editingId ? 'Editar categoría' : 'Nueva categoría'}</h2>
          <form className="compact-form" onSubmit={saveCategory}>
            <label>Nombre<input required value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label>
              Categoría padre
              <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
                <option value="">Sin padre (nivel superior)</option>
                {categories.filter((c) => c.id !== editingId).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            {editingId && <button type="button" className="quiet-link" onClick={resetForm}>Cancelar edición</button>}
            <button type="submit">{editingId ? 'Guardar cambios' : 'Agregar categoría'}</button>
          </form>
        </section>
      </RequireRole>

      <section className="panel">
        <div className="panel-heading">
          <div><span className="eyebrow">Estructura</span><h2>Categorías activas</h2></div>
          <span className="role-badge">{categories.length} categorías</span>
        </div>
        {roots.map((category) => (
          <div key={category.id}>
            <div className="list-row">
              <span><strong>{category.name}</strong><small>{category._count?.products ?? 0} productos</small></span>
              <RequireRole roles={WRITE_ROLES}>
                <div className="row-actions">
                  <button type="button" className="quiet-link" onClick={() => startEdit(category)}>Editar</button>
                </div>
              </RequireRole>
              <RequireRole roles={DELETE_ROLES}>
                <div className="row-actions">
                  <button type="button" className="danger" onClick={() => void deleteCategory(category)}>Eliminar</button>
                </div>
              </RequireRole>
            </div>
            {childrenOf(category.id).map((child) => (
              <div className="list-row is-child" key={child.id}>
                <span><strong>↳ {child.name}</strong><small>{child._count?.products ?? 0} productos</small></span>
                <RequireRole roles={WRITE_ROLES}>
                  <div className="row-actions">
                    <button type="button" className="quiet-link" onClick={() => startEdit(child)}>Editar</button>
                  </div>
                </RequireRole>
                <RequireRole roles={DELETE_ROLES}>
                  <div className="row-actions">
                    <button type="button" className="danger" onClick={() => void deleteCategory(child)}>Eliminar</button>
                  </div>
                </RequireRole>
              </div>
            ))}
          </div>
        ))}
        {!roots.length && !error && <p className="muted">No hay categorías para mostrar.</p>}
      </section>
    </OwnerShell>
  );
}