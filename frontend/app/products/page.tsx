'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiError, Membership } from '@/lib/api';

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  price: number | string;
  cost: number | string;
  isActive: boolean;
  attributes?: Record<string, unknown>;
  category?: { name: string } | null;
  unit?: { name: string } | null;
};

export default function ProductsPage() {
  const { token, organizationId, orgRole, memberships } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [attributes, setAttributes] = useState<Record<string, unknown>>({});

  // Obtener membresía activa y productSchema
  const activeMembership = memberships.find((m) => m.organizationId === organizationId) ?? null;
  const productSchema = activeMembership?.organization?.businessType?.productSchema ?? {};
  const schemaFields = Object.entries(productSchema);

  async function loadProducts() {
    if (!token || !organizationId) return;
    try {
      setProducts(await apiFetch<Product[]>(`/products${search ? `?search=${encodeURIComponent(search)}` : ''}`, { token, organizationId }));
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudieron cargar los productos');
    }
  }

  useEffect(() => { void loadProducts(); }, [organizationId, token]);

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !organizationId) return;
    try {
      await apiFetch('/products', {
        method: 'POST',
        token,
        organizationId,
        body: JSON.stringify({ name, sku: sku || undefined, price: Number(price), attributes }),
      });
      setName('');
      setSku('');
      setPrice('');
      setAttributes({});
      setMessage('Producto creado correctamente');
      setError('');
      await loadProducts();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo crear el producto');
    }
  }

  if (orgRole === 'OWNER') {
    return (
      <ProtectedRoute>
        <section className="panel restricted-panel">
          <span className="eyebrow">Acceso restringido</span>
          <h1>Catálogo gestionado por el equipo operativo</h1>
          <p>Como propietario, consulta resultados y configura el negocio desde las opciones de administración.</p>
        </section>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="app-shell">
        <aside className="sidebar">
          <strong>PModular</strong>
          <nav>
            <a href="/dashboard">Resumen</a>
            <a className="active" href="/products">Productos</a>
            <a href="/categories">Categorías</a>
            <a href="/units">Unidades</a>
          </nav>
        </aside>
        <main className="workspace">
          <header className="topbar">
            <div>
              <span className="eyebrow">Catálogo</span>
              <h1>Productos</h1>
            </div>
          </header>
          <section className="content-grid">
            <article className="panel">
              <div className="panel-heading"><h2>Nuevo producto</h2></div>
              <form onSubmit={createProduct} className="compact-form">
                <label>
                  Nombre
                  <input required value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label>
                  SKU
                  <input value={sku} onChange={(e) => setSku(e.target.value)} />
                </label>
                <label>
                  Precio
                  <input required min="0" step="0.01" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                </label>
                {schemaFields.map(([key, definition]) => {
                  const field = definition as { type?: string; default?: unknown };
                  const isBoolean = field.type === 'boolean';
                  return (
                    <label key={key}>
                      {key.replace(/([A-Z])/g, ' $1')}
                      <input
                        type={isBoolean ? 'checkbox' : field.type === 'date' ? 'date' : 'text'}
                        checked={isBoolean ? Boolean(attributes[key]) : undefined}
                        value={isBoolean ? undefined : String(attributes[key] ?? field.default ?? '')}
                        onChange={(e) => setAttributes({ ...attributes, [key]: isBoolean ? e.target.checked : e.target.value })}
                      />
                    </label>
                  );
                })}
                <button type="submit">Agregar producto</button>
              </form>
            </article>
            <article className="panel">
              <div className="panel-heading">
                <h2>Catálogo actual</h2>
                <form onSubmit={(e) => { e.preventDefault(); void loadProducts(); }}>
                  <input aria-label="Buscar productos" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </form>
              </div>
              {message && <p className="success-message">{message}</p>}
              {error && <p className="error-message" role="alert">{error}</p>}
              {products.map((product) => (
                <div className="list-row" key={product.id}>
                  <span>
                    <strong>{product.name}</strong>
                    <small>{product.sku || 'Sin SKU'} · {product.category?.name || 'Sin categoría'}</small>
                  </span>
                  <strong>{Number(product.price).toFixed(2)}</strong>
                </div>
              ))}
              {!products.length && <p className="muted">No hay productos para mostrar.</p>}
            </article>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
