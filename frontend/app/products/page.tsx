'use client';

import { FormEvent, useEffect, useState, useCallback } from 'react';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { RequireRole } from '@/components/RequireRole';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  price: number | string;
  cost?: number | string | null;
  isActive: boolean;
  attributes?: Record<string, unknown>;
  category?: { id: string; name: string } | null;
  unit?: { id: string; name: string; symbol?: string | null } | null;
};

type Category = { id: string; name: string };
type Unit = { id: string; name: string; symbol?: string | null; isFractionable: boolean };

type SchemaField = { type?: string; default?: unknown; options?: unknown[]; label?: string };

// Crear/editar catálogo: OWNER/ADMIN/INVENTARIO (espejo del OrgRolesGuard del backend)
const WRITE_ROLES = ['OWNER', 'ADMIN', 'INVENTARIO'];
// Eliminar productos: OWNER/ADMIN según el backend
const DELETE_ROLES = ['OWNER', 'ADMIN'];

function schemaLabel(key: string, field: SchemaField) {
  if (field.label) return field.label;
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

export default function ProductsPage() {
  const { token, organizationId, orgRole, memberships } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [attributes, setAttributes] = useState<Record<string, unknown>>({});
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // productSchema del BusinessType de la membresía activa
  const activeMembership = memberships.find((m) => m.organizationId === organizationId) ?? null;
  const productSchema = activeMembership?.organization?.businessType?.productSchema ?? {};
  const schemaFields = Object.entries(productSchema);

  const canWrite = orgRole !== null && WRITE_ROLES.includes(orgRole);
  const canDelete = orgRole !== null && DELETE_ROLES.includes(orgRole);

  const loadProducts = useCallback(async () => {
    if (!token || !organizationId) return;
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterCategory) params.set('categoryId', filterCategory);
      const qs = params.toString();
      setProducts(await apiFetch<Product[]>(`/products${qs ? `?${qs}` : ''}`, { token, organizationId }));
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudieron cargar los productos');
    }
  }, [token, organizationId, search, filterCategory]);

  const loadReferences = useCallback(async () => {
    if (!token || !organizationId) return;
    try {
      const [catRows, unitRows] = await Promise.all([
        apiFetch<Category[]>('/categories', { token, organizationId }),
        apiFetch<Unit[]>('/units-of-measure', { token, organizationId }),
      ]);
      setCategories(catRows);
      setUnits(unitRows);
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudieron cargar categorías y unidades');
    }
  }, [token, organizationId]);

  useEffect(() => { void loadProducts(); }, [loadProducts]);
  useEffect(() => { void loadReferences(); }, [loadReferences]);

  function resetForm() {
    setName(''); setSku(''); setPrice(''); setCost(''); setCategoryId(''); setUnitId(''); setAttributes({});
    setEditingId(null); setMessage('');
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setName(product.name); setSku(product.sku ?? ''); setPrice(String(product.price ?? ''));
    setCost(product.cost != null ? String(product.cost) : '');
    setCategoryId(product.category?.id ?? ''); setUnitId(product.unit?.id ?? '');
    setAttributes((product.attributes ?? {}) as Record<string, unknown>);
    setMessage(''); setError('');
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !organizationId) return;
    const payload = {
      name, sku: sku || undefined, price: Number(price),
      cost: cost !== '' ? Number(cost) : undefined,
      categoryId: categoryId || null, unitId: unitId || null, attributes,
    };
    try {
      if (editingId) {
        await apiFetch(`/products/${editingId}`, { method: 'PATCH', token, organizationId, body: JSON.stringify(payload) });
        setMessage('Producto actualizado correctamente');
      } else {
        await apiFetch('/products', { method: 'POST', token, organizationId, body: JSON.stringify(payload) });
        setMessage('Producto creado correctamente');
      }
      setError(''); resetForm(); await loadProducts();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo guardar el producto');
    }
  }

  async function deleteProduct(product: Product) {
    if (!token || !organizationId) return;
    if (!window.confirm(`¿Eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await apiFetch(`/products/${product.id}`, { method: 'DELETE', token, organizationId });
      setMessage(`Producto "${product.name}" eliminado`); setError('');
      await loadProducts();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo eliminar el producto');
    }
  }

  return (
    <OwnerShell active="products">
      <OwnerHeader eyebrow="Catálogo" title="Productos" />
      {error && <p className="error-message" role="alert">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      <RequireRole roles={WRITE_ROLES}>
        <section className="panel">
          <span className="eyebrow">{editingId ? 'Edición' : 'Alta'}</span>
          <h2>{editingId ? 'Editar producto' : 'Nuevo producto'}</h2>
          <form className="compact-form" onSubmit={saveProduct}>
            <label>Nombre<input required value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label>SKU<input value={sku} onChange={(e) => setSku(e.target.value)} /></label>
            <label>Precio<input required min="0" step="0.01" type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
            <label>Costo<input min="0" step="0.01" type="number" value={cost} onChange={(e) => setCost(e.target.value)} /></label>
            <label>
              Categoría
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Sin categoría</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label>
              Unidad
              <select value={unitId} onChange={(e) => setUnitId(e.target.value)}>
                <option value="">Sin unidad</option>
                {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}{unit.symbol ? ` (${unit.symbol})` : ''}</option>)}
              </select>
            </label>
            {schemaFields.map(([key, definition]) => renderSchemaField(key, definition as SchemaField, attributes, setAttributes))}
            {editingId && <button type="button" className="quiet-link" onClick={resetForm}>Cancelar edición</button>}
            <button type="submit">{editingId ? 'Guardar cambios' : 'Agregar producto'}</button>
          </form>
        </section>
      </RequireRole>

      <section className="panel">
        <div className="panel-heading">
          <div><span className="eyebrow">Catálogo</span><h2>Catálogo actual</h2></div>
          <span className="role-badge">{products.length} productos</span>
        </div>
        <div className="field-actions">
          <input aria-label="Buscar productos" placeholder="Buscar por nombre o SKU..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select aria-label="Filtrar por categoría" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </div>
        <div>
          {products.map((product) => (
            <div className="list-row" key={product.id}>
              <span>
                <strong>{product.name}</strong>
                <small>{product.sku || 'Sin SKU'} · {product.category?.name || 'Sin categoría'} · {product.unit?.name || 'Sin unidad'}</small>
              </span>
              <span className="list-right">
                <strong>{Number(product.price).toFixed(2)}</strong>
                <RequireRole roles={WRITE_ROLES}>
                  <div className="row-actions">
                    <button type="button" className="quiet-link" onClick={() => startEdit(product)}>Editar</button>
                  </div>
                </RequireRole>
                {canDelete && (
                  <button type="button" className="danger" onClick={() => void deleteProduct(product)}>Eliminar</button>
                )}
              </span>
            </div>
          ))}
          {!products.length && <p className="muted">No hay productos para mostrar.</p>}
        </div>
      </section>
    </OwnerShell>
  );
}

function renderSchemaField(
  key: string,
  field: SchemaField,
  attributes: Record<string, unknown>,
  setAttributes: (next: Record<string, unknown>) => void,
) {
  const type = field.type ?? 'string';
  const label = schemaLabel(key, field);
  return (
    <label key={key}>
      {label}
      {type === 'boolean' ? (
        <input type="checkbox" checked={Boolean(attributes[key])} onChange={(e) => setAttributes({ ...attributes, [key]: e.target.checked })} />
      ) : type === 'number' ? (
        <input type="number" step="any" value={attributes[key] == null ? '' : String(attributes[key])} onChange={(e) => setAttributes({ ...attributes, [key]: e.target.value })} />
      ) : type === 'date' ? (
        <input type="date" value={typeof attributes[key] === 'string' ? attributes[key] : ''} onChange={(e) => setAttributes({ ...attributes, [key]: e.target.value })} />
      ) : (
        <input type="text" value={attributes[key] ? String(attributes[key]) : String(field.default ?? '')} onChange={(e) => setAttributes({ ...attributes, [key]: e.target.value })} />
      )}
    </label>
  );
}
