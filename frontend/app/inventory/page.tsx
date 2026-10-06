'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { RequireRole } from '@/components/RequireRole';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';

type InventoryItem = {
  id: string;
  quantity: number | string;
  reserved: number | string;
  averageCost: number | string;
  productId: string;
  product: { id: string; name: string; sku?: string | null; category?: { name: string } | null; unit?: { name: string; symbol?: string | null } | null };
};
type ProductReference = { id: string; name: string; sku?: string | null; isActive: boolean; category?: { name: string } | null; unit?: { name: string; symbol?: string | null } | null };
type StockMovement = { id: string; type: string; reason: string; quantity: number | string; isPositive: boolean; createdAt: string; notes?: string | null; product: { name: string; sku?: string | null } };
type AlertBatch = { id: string; batchNumber: string; currentQuantity: number | string; expirationDate?: string | null; product: { name: string; sku?: string | null } };
const WRITE_ROLES = ['OWNER', 'ADMIN', 'INVENTARIO'];
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'PEN' });

export default function InventoryPage() {
  const { token, organizationId } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [expiring, setExpiring] = useState<AlertBatch[]>([]);
  const [search, setSearch] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [adjustment, setAdjustment] = useState({
    productId: '', type: 'INGRESO', quantity: '', reason: 'ENTRADA_INICIAL',
    notes: '', unitCost: '', batchNumber: '',
  });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!token || !organizationId) return;
    setError('');
    try {
      const [inventoryRows, movementRows, expiringRows, productRows] = await Promise.all([
        apiFetch<InventoryItem[]>('/inventory', { token, organizationId }),
        apiFetch<StockMovement[]>('/stock-movements', { token, organizationId }),
        apiFetch<AlertBatch[]>('/inventory/alerts/expiring?days=30', { token, organizationId }),
        apiFetch<ProductReference[]>('/products', { token, organizationId }),
      ]);
      const inventoryByProduct = new Map(inventoryRows.map((item) => [item.productId, item]));
      const completeInventory = productRows.filter((product) => product.isActive).map((product) => inventoryByProduct.get(product.id) ?? ({
        id: `no-stock-${product.id}`,
        productId: product.id,
        product: { id: product.id, name: product.name, sku: product.sku, category: product.category, unit: product.unit },
        quantity: 0,
        reserved: 0,
        averageCost: 0,
      } satisfies InventoryItem));
      setItems(completeInventory);
      setMovements(movementRows.slice(0, 8));
      setExpiring(expiringRows);
      if (!adjustment.productId && completeInventory[0]) {
        setAdjustment((current) => ({ ...current, productId: completeInventory[0].productId }));
      }
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo cargar el inventario');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [organizationId, token]);

  const filteredItems = useMemo(() => items.filter((item) => {
    const term = search.toLocaleLowerCase();
    const matches = !term || item.product.name.toLocaleLowerCase().includes(term) || item.product.sku?.toLocaleLowerCase().includes(term);
    const quantity = Number(item.quantity);
    return matches && (!lowOnly || quantity <= 10);
  }), [items, search, lowOnly]);

  const summary = useMemo(() => ({
    units: items.reduce((sum, item) => sum + Number(item.quantity), 0),
    value: items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.averageCost), 0),
    low: items.filter((item) => Number(item.quantity) > 0 && Number(item.quantity) <= 10).length,
    empty: items.filter((item) => Number(item.quantity) <= 0).length,
  }), [items]);

  async function submitAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !organizationId) return;
    const quantity = Number(adjustment.quantity);
    if (!adjustment.productId || !quantity || quantity <= 0) {
      setError('Selecciona un producto e ingresa una cantidad positiva.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (adjustment.type === 'INGRESO' && adjustment.reason === 'ENTRADA_INICIAL') {
        await apiFetch('/stock-movements/initial-stock', {
          method: 'POST', token, organizationId,
          body: JSON.stringify({
            productId: adjustment.productId,
            quantity,
            unitCost: Number(adjustment.unitCost) || 0,
            batchNumber: adjustment.batchNumber || undefined,
          }),
        });
      } else {
        await apiFetch('/stock-movements', {
          method: 'POST', token, organizationId,
          body: JSON.stringify({
            productId: adjustment.productId,
            quantity,
            type: adjustment.type,
            reason: adjustment.reason,
            notes: adjustment.notes || undefined,
          }),
        });
      }
      setNotice('Movimiento registrado. Las existencias y el historial se actualizaron.');
      setAdjustment((current) => ({ ...current, quantity: '', notes: '', unitCost: '', batchNumber: '' }));
      await load();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo registrar el movimiento');
    } finally {
      setBusy(false);
    }
  }

  const dateFormatter = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <OwnerShell active="inventory">
      <OwnerHeader eyebrow="Control operativo" title="Inventario" />
      {error && <p className="error-message" role="alert">{error}</p>}
      {notice && <p className="success-message" role="status">{notice}</p>}

      <section className="metric-grid inventory-metrics">
        <article className="metric-card"><span>Unidades disponibles</span><strong>{summary.units.toLocaleString('es-MX')}</strong><small>{items.length} productos con registro</small></article>
        <article className="metric-card"><span>Valor estimado</span><strong>{money.format(summary.value)}</strong><small>Según costo promedio</small></article>
        <article className="metric-card"><span>Stock bajo</span><strong>{summary.low}</strong><small>Existencias de 10 unidades o menos</small></article>
        <article className="metric-card"><span>Sin existencias</span><strong>{summary.empty}</strong><small>{expiring.length} lotes próximos a vencer</small></article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div><span className="eyebrow">Existencias</span><h2>Stock por producto</h2></div>
          <span className="role-badge">{filteredItems.length} productos</span>
        </div>
        <div className="inventory-filters">
          <input aria-label="Buscar inventario" placeholder="Buscar por producto o SKU..." value={search} onChange={(event) => setSearch(event.target.value)} />
          <label className="inventory-toggle"><input type="checkbox" checked={lowOnly} onChange={(event) => setLowOnly(event.target.checked)} /> Solo stock bajo</label>
        </div>
        {loading ? <p className="loading-message">Cargando existencias...</p> : filteredItems.length ? (
          <div className="platform-table-wrap">
            <table className="platform-table inventory-table">
              <thead><tr><th>Producto</th><th>Categoría</th><th>Disponible</th><th>Reservado</th><th>Costo promedio</th><th>Valor</th><th>Estado</th></tr></thead>
              <tbody>{filteredItems.map((item) => {
                const quantity = Number(item.quantity);
                const reserved = Number(item.reserved);
                const state = quantity <= 0 ? 'Agotado' : quantity <= 10 ? 'Stock bajo' : 'Disponible';
                return <tr key={item.id}>
                  <td><strong>{item.product.name}</strong><small>{item.product.sku || 'Sin SKU'}{item.product.unit ? ` · ${item.product.unit.name}` : ''}</small></td>
                  <td>{item.product.category?.name || 'Sin categoría'}</td>
                  <td><strong>{quantity.toLocaleString('es-MX')}</strong></td>
                  <td>{reserved.toLocaleString('es-MX')}</td>
                  <td>{money.format(Number(item.averageCost))}</td>
                  <td>{money.format(quantity * Number(item.averageCost))}</td>
                  <td><span className={`inventory-status ${quantity <= 0 ? 'is-empty' : quantity <= 10 ? 'is-low' : 'is-available'}`}>{state}</span></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        ) : <p className="muted">No hay productos para los filtros seleccionados.</p>}
      </section>

      <div className="content-grid inventory-bottom-grid">
        <RequireRole roles={WRITE_ROLES}>
          <section className="panel">
            <div className="panel-heading"><div><span className="eyebrow">Control de stock</span><h2>Registrar movimiento</h2></div></div>
            <form className="compact-form" onSubmit={submitAdjustment}>
              <label>Producto<select required value={adjustment.productId} onChange={(event) => setAdjustment({ ...adjustment, productId: event.target.value })}>
                <option value="">Seleccionar producto...</option>{items.map((item) => <option key={item.productId} value={item.productId}>{item.product.name}{item.product.sku ? ` · ${item.product.sku}` : ''}</option>)}
              </select></label>
              <label>Tipo<select value={adjustment.type} onChange={(event) => setAdjustment({ ...adjustment, type: event.target.value, reason: event.target.value === 'INGRESO' ? 'ENTRADA_INICIAL' : 'MERMA' })}>
                <option value="INGRESO">Entrada</option><option value="SALIDA">Salida</option>
              </select></label>
              <label>Motivo<select value={adjustment.reason} onChange={(event) => setAdjustment({ ...adjustment, reason: event.target.value })}>
                {adjustment.type === 'INGRESO' ? <><option value="ENTRADA_INICIAL">Existencia inicial</option><option value="COMPRA">Compra</option><option value="DEVOLUCION_CLIENTE">Devolución de cliente</option><option value="PRODUCCION">Producción</option><option value="CONTEO_FISICO">Conteo físico (aumenta)</option></> : <><option value="MERMA">Merma</option><option value="ROBO">Robo</option><option value="OBSOLETO">Obsoleto</option><option value="CONSUMO_INTERNO">Consumo interno</option><option value="CONTEO_FISICO">Conteo físico (disminuye)</option></>}
              </select></label>
              <label>Cantidad<input required min="0.0001" step="any" type="number" value={adjustment.quantity} onChange={(event) => setAdjustment({ ...adjustment, quantity: event.target.value })} /></label>
              {adjustment.type === 'INGRESO' && adjustment.reason === 'ENTRADA_INICIAL' && <>
                <label>Costo unitario<input min="0" step="0.0001" type="number" value={adjustment.unitCost} onChange={(event) => setAdjustment({ ...adjustment, unitCost: event.target.value })} /></label>
                <label>Lote (opcional)<input value={adjustment.batchNumber} onChange={(event) => setAdjustment({ ...adjustment, batchNumber: event.target.value })} /></label>
              </>}
              <label>Nota<input value={adjustment.notes} onChange={(event) => setAdjustment({ ...adjustment, notes: event.target.value })} /></label>
              <button type="submit" disabled={busy || !items.length}>{busy ? 'Registrando...' : 'Registrar movimiento'}</button>
            </form>
          </section>
        </RequireRole>

        <section className="panel">
          <div className="panel-heading"><div><span className="eyebrow">Trazabilidad</span><h2>Movimientos recientes</h2></div></div>
          {movements.map((movement) => <div className="list-row" key={movement.id}>
            <span><strong>{movement.product.name}</strong><small>{movement.reason.replaceAll('_', ' ')} · {dateFormatter.format(new Date(movement.createdAt))}</small></span>
            <strong className={movement.isPositive ? 'inventory-positive' : 'inventory-negative'}>{movement.isPositive ? '+' : '-'}{Number(movement.quantity)}</strong>
          </div>)}
          {!movements.length && <p className="muted">Todavía no hay movimientos registrados.</p>}
        </section>
      </div>

      {!!expiring.length && <section className="panel inventory-expiring">
        <div className="panel-heading"><div><span className="eyebrow">Alertas</span><h2>Lotes próximos a vencer</h2></div><span className="role-badge">{expiring.length} lotes</span></div>
        {expiring.map((batch) => <div className="list-row" key={batch.id}>
          <span><strong>{batch.product.name}</strong><small>Lote {batch.batchNumber} · Vence {batch.expirationDate ? dateFormatter.format(new Date(batch.expirationDate)) : 'sin fecha'}</small></span>
          <strong>{Number(batch.currentQuantity)} uds.</strong>
        </div>)}
      </section>}
    </OwnerShell>
  );
}