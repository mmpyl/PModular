'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { RequireRole } from '@/components/RequireRole';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError, apiFetch } from '@/lib/api';

type Supplier = { id: string; name: string; taxId?: string | null };
type Product = {
  id: string;
  name: string;
  sku?: string | null;
  cost?: number | string | null;
  unit?: { name: string; symbol?: string | null } | null;
};
type OrderItem = {
  id: string;
  productId: string;
  product: Product;
  quantityOrdered: number | string;
  quantityReceived: number | string;
  unitCost: number | string;
  discount: number | string;
  taxRate: number | string;
  total: number | string;
  batchNumber?: string | null;
  expirationDate?: string | null;
  notes?: string | null;
};
type Order = {
  id: string;
  orderNumber: string;
  status: string;
  supplierId: string;
  supplier: Supplier;
  orderDate: string;
  expectedDeliveryDate?: string | null;
  receivedDate?: string | null;
  paymentTerm: string;
  paymentDueDate?: string | null;
  subtotal: number | string;
  taxAmount: number | string;
  discount: number | string;
  total: number | string;
  currency: string;
  notes?: string | null;
  internalNotes?: string | null;
  externalReference?: string | null;
  items: OrderItem[];
};
type DraftLine = {
  key: string;
  productId: string;
  quantityOrdered: string;
  unitCost: string;
  discount: string;
  taxRate: string;
  batchNumber: string;
  expirationDate: string;
  notes: string;
};
type OrderDraft = {
  id?: string;
  supplierId: string;
  expectedDeliveryDate: string;
  paymentTerm: string;
  paymentDueDate: string;
  discount: string;
  currency: string;
  notes: string;
  internalNotes: string;
  externalReference: string;
  items: DraftLine[];
};
type ReceiveDraft = Record<string, { quantity: string; batchNumber: string; expirationDate: string }>;

const STATUS_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  ENVIADA: 'Enviada',
  CONFIRMADA: 'Confirmada',
  PARCIALMENTE_RECIBIDA: 'Recepción parcial',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
};
const PAYMENT_TERMS: Record<string, string> = {
  CONTADO: 'Contado',
  CREDITO_7_DIAS: 'Crédito 7 días',
  CREDITO_15_DIAS: 'Crédito 15 días',
  CREDITO_30_DIAS: 'Crédito 30 días',
  CREDITO_60_DIAS: 'Crédito 60 días',
  CREDITO_90_DIAS: 'Crédito 90 días',
  PERSONALIZADO: 'Personalizado',
};
const EDIT_ROLES = ['OWNER', 'ADMIN', 'INVENTARIO'];
const DELETE_ROLES = ['OWNER', 'ADMIN'];
const TAX_RATE = 0.18;

const newLine = (): DraftLine => ({
  key: crypto.randomUUID(), productId: '', quantityOrdered: '1', unitCost: '',
  discount: '0', taxRate: String(TAX_RATE), batchNumber: '', expirationDate: '', notes: '',
});

function dateInput(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(value)) : 'Sin fecha';
}

function money(value: number | string, currency: string) {
  const amount = Number(value) || 0;
  try {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function statusClass(status: string) {
  return `purchase-status purchase-status-${status.toLowerCase()}`;
}

export default function PurchaseOrdersPage() {
  const { token, organizationId, orgRole } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [draft, setDraft] = useState<OrderDraft | null>(null);
  const [receiveDraft, setReceiveDraft] = useState<ReceiveDraft | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token || !organizationId) return;
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterSupplier) params.set('supplierId', filterSupplier);
      const query = params.toString();
      const [orderRows, supplierRows, productRows] = await Promise.all([
        apiFetch<Order[]>(`/purchase-orders${query ? `?${query}` : ''}`, { token, organizationId }),
        apiFetch<Supplier[]>('/business-entities?type=PROVEEDOR', { token, organizationId }),
        apiFetch<Product[]>('/products', { token, organizationId }),
      ]);
      setOrders(orderRows);
      setSuppliers(supplierRows);
      setProducts(productRows);
      if (selected) {
        const refreshed = orderRows.find((order) => order.id === selected.id);
        if (refreshed) setSelected(refreshed);
      }
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudieron cargar las órdenes');
    } finally {
      setLoading(false);
    }
  }, [token, organizationId, filterStatus, filterSupplier, selected?.id]);

  useEffect(() => { void load(); }, [load]);

  const totals = useMemo(() => {
    if (!draft) return { subtotal: 0, tax: 0, total: 0 };
    const subtotal = draft.items.reduce((sum, item) => sum + (Number(item.quantityOrdered) || 0) * (Number(item.unitCost) || 0), 0);
    const tax = draft.items.reduce((sum, item) => {
      const gross = (Number(item.quantityOrdered) || 0) * (Number(item.unitCost) || 0);
      const discounted = Math.max(0, gross - (Number(item.discount) || 0));
      return sum + discounted * (Number(item.taxRate) || 0);
    }, 0);
    return { subtotal, tax, total: subtotal + tax - (Number(draft.discount) || 0) };
  }, [draft]);

  function startNew() {
    setSelected(null);
    setReceiveDraft(null);
    setDraft({
      supplierId: suppliers[0]?.id ?? '', expectedDeliveryDate: '', paymentTerm: 'CONTADO',
      paymentDueDate: '', discount: '0', currency: 'PEN', notes: '', internalNotes: '',
      externalReference: '', items: [newLine()],
    });
    setError('');
    setNotice('');
  }

  function startEdit(order: Order) {
    setSelected(order);
    setReceiveDraft(null);
    setDraft({
      id: order.id,
      supplierId: order.supplierId,
      expectedDeliveryDate: dateInput(order.expectedDeliveryDate),
      paymentTerm: order.paymentTerm,
      paymentDueDate: dateInput(order.paymentDueDate),
      discount: String(order.discount ?? 0),
      currency: order.currency,
      notes: order.notes ?? '',
      internalNotes: order.internalNotes ?? '',
      externalReference: order.externalReference ?? '',
      items: order.items.map((item) => ({
        key: item.id,
        productId: item.productId,
        quantityOrdered: String(item.quantityOrdered),
        unitCost: String(item.unitCost),
        discount: String(item.discount ?? 0),
        taxRate: String(item.taxRate ?? TAX_RATE),
        batchNumber: item.batchNumber ?? '',
        expirationDate: dateInput(item.expirationDate),
        notes: item.notes ?? '',
      })),
    });
    setError('');
    setNotice('');
  }

  function updateLine(key: string, changes: Partial<DraftLine>) {
    setDraft((current) => current && ({
      ...current,
      items: current.items.map((item) => item.key === key ? { ...item, ...changes } : item),
    }));
  }

  async function saveOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !organizationId || !draft) return;
    if (!draft.items.length || draft.items.some((item) => !item.productId || Number(item.quantityOrdered) <= 0 || Number(item.unitCost) < 0)) {
      setError('Agrega al menos un producto y revisa cantidades y costos.');
      return;
    }
    if (totals.total < 0) {
      setError('El descuento total no puede superar el importe de la orden.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    const payload = {
      supplierId: draft.supplierId,
      expectedDeliveryDate: draft.expectedDeliveryDate || undefined,
      paymentTerm: draft.paymentTerm,
      paymentDueDate: draft.paymentDueDate || undefined,
      discount: Number(draft.discount) || 0,
      currency: draft.currency,
      notes: draft.notes || undefined,
      internalNotes: draft.internalNotes || undefined,
      externalReference: draft.externalReference || undefined,
      items: draft.items.map((item) => ({
        productId: item.productId,
        quantityOrdered: Number(item.quantityOrdered),
        unitCost: Number(item.unitCost),
        discount: Number(item.discount) || 0,
        taxRate: Number(item.taxRate) || 0,
        batchNumber: item.batchNumber || undefined,
        expirationDate: item.expirationDate || undefined,
        notes: item.notes || undefined,
      })),
    };
    try {
      const saved = draft.id
        ? await apiFetch<Order>(`/purchase-orders/${draft.id}`, { method: 'PATCH', token, organizationId, body: JSON.stringify(payload) })
        : await apiFetch<Order>('/purchase-orders', { method: 'POST', token, organizationId, body: JSON.stringify(payload) });
      setDraft(null);
      setSelected(saved);
      setNotice(draft.id ? 'Borrador actualizado.' : `Orden ${saved.orderNumber} creada como borrador.`);
      await load();
      setSelected(saved);
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo guardar la orden');
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(order: Order, status: string) {
    if (!token || !organizationId) return;
    setBusy(true);
    setError('');
    try {
      const updated = status === 'CANCELADA'
        ? await apiFetch<Order>(`/purchase-orders/${order.id}/cancel`, { method: 'POST', token, organizationId })
        : await apiFetch<Order>(`/purchase-orders/${order.id}`, {
          method: 'PATCH', token, organizationId, body: JSON.stringify({ status }),
        });
      setSelected(updated);
      setNotice(`Orden ${updated.orderNumber}: ${STATUS_LABELS[updated.status] ?? updated.status}.`);
      await load();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo actualizar el estado');
    } finally {
      setBusy(false);
    }
  }

  function startReceive(order: Order) {
    setSelected(order);
    setDraft(null);
    setReceiveDraft(Object.fromEntries(order.items.map((item) => [item.id, {
      quantity: '', batchNumber: '', expirationDate: '',
    }])));
    setError('');
    setNotice('');
  }

  async function receiveOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !organizationId || !selected || !receiveDraft) return;
    const receiveItems = selected.items.map((item) => {
      const input = receiveDraft[item.id];
      const quantityReceived = Number(input?.quantity) || 0;
      return {
        itemId: item.id,
        quantityReceived,
        batchNumber: input?.batchNumber || undefined,
        expirationDate: input?.expirationDate || undefined,
        pending: Number(item.quantityOrdered) - Number(item.quantityReceived),
      };
    }).filter((item) => item.quantityReceived > 0);
    if (!receiveItems.length) {
      setError('Indica una cantidad mayor a cero para recibir.');
      return;
    }
    const overReceived = receiveItems.find((item) => item.quantityReceived > item.pending);
    if (overReceived) {
      setError('La cantidad recibida no puede superar lo pendiente de la orden.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const updated = await apiFetch<Order>(`/purchase-orders/${selected.id}/receive`, {
        method: 'POST', token, organizationId,
        body: JSON.stringify({ items: receiveItems.map(({ pending, ...item }) => item) }),
      });
      setSelected(updated);
      setReceiveDraft(null);
      setNotice(updated.status === 'COMPLETADA' ? 'Recepción completa; inventario actualizado.' : 'Recepción registrada; inventario actualizado.');
      await load();
      setSelected(updated);
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo registrar la recepción');
    } finally {
      setBusy(false);
    }
  }

  async function deleteDraft(order: Order) {
    if (!token || !organizationId || !window.confirm(`¿Eliminar el borrador ${order.orderNumber}?`)) return;
    setBusy(true);
    try {
      await apiFetch(`/purchase-orders/${order.id}`, { method: 'DELETE', token, organizationId });
      if (selected?.id === order.id) setSelected(null);
      setNotice(`Borrador ${order.orderNumber} eliminado.`);
      await load();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo eliminar el borrador');
    } finally {
      setBusy(false);
    }
  }

  const canEdit = orgRole !== null && EDIT_ROLES.includes(orgRole);
  const canDelete = orgRole !== null && DELETE_ROLES.includes(orgRole);

  return (
    <OwnerShell active="purchases">
      <OwnerHeader eyebrow="Abastecimiento" title="Órdenes de compra" />
      {error && <p className="error-message" role="alert">{error}</p>}
      {notice && <p className="success-message" role="status">{notice}</p>}

      <section className="panel purchase-history">
        <div className="panel-heading">
          <div><span className="eyebrow">Abastecimiento</span><h2>Historial de órdenes</h2></div>
          {canEdit && <button type="button" onClick={startNew}>＋ Nueva orden</button>}
        </div>
        <div className="purchase-filters">
          <label>Estado
            <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
              <option value="">Todos los estados</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>Proveedor
            <select value={filterSupplier} onChange={(event) => setFilterSupplier(event.target.value)}>
              <option value="">Todos los proveedores</option>
              {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </select>
          </label>
          <span className="role-badge">{orders.length} órdenes</span>
        </div>
        {loading ? <p className="loading-message">Cargando órdenes...</p> : orders.length ? (
          <div className="platform-table-wrap">
            <table className="platform-table purchase-table">
              <thead><tr><th>Orden</th><th>Proveedor</th><th>Fecha</th><th>Entrega esperada</th><th>Estado</th><th>Total</th><th /></tr></thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className={selected?.id === order.id ? 'purchase-row-selected' : ''}>
                    <td><button type="button" className="purchase-order-link" onClick={() => { setSelected(order); setDraft(null); setReceiveDraft(null); }}>{order.orderNumber}</button></td>
                    <td>{order.supplier?.name ?? 'Proveedor'}</td>
                    <td>{formatDate(order.orderDate)}</td>
                    <td>{formatDate(order.expectedDeliveryDate)}</td>
                    <td><span className={statusClass(order.status)}>{STATUS_LABELS[order.status] ?? order.status}</span></td>
                    <td><strong>{money(order.total, order.currency)}</strong></td>
                    <td>{order.status === 'BORRADOR' && canEdit && <button type="button" className="btn-quiet" onClick={() => startEdit(order)}>Editar</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="muted">No hay órdenes para los filtros seleccionados.</p>}
      </section>

      {draft && (
        <section className="panel purchase-editor">
          <div className="panel-heading">
            <div><span className="eyebrow">{draft.id ? 'Borrador' : 'Nueva orden'}</span><h2>{draft.id ? `Editar ${selected?.orderNumber ?? 'borrador'}` : 'Registrar compra'}</h2></div>
            <button type="button" className="btn-quiet" onClick={() => setDraft(null)}>Cerrar</button>
          </div>
          <form className="purchase-form" onSubmit={saveOrder}>
            <div className="purchase-form-grid">
              <label>Proveedor<select required value={draft.supplierId} onChange={(event) => setDraft({ ...draft, supplierId: event.target.value })}><option value="">Seleccionar proveedor...</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label>
              <label>Entrega esperada<input type="date" value={draft.expectedDeliveryDate} onChange={(event) => setDraft({ ...draft, expectedDeliveryDate: event.target.value })} /></label>
              <label>Término de pago<select value={draft.paymentTerm} onChange={(event) => setDraft({ ...draft, paymentTerm: event.target.value })}>{Object.entries(PAYMENT_TERMS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Vencimiento<input type="date" value={draft.paymentDueDate} onChange={(event) => setDraft({ ...draft, paymentDueDate: event.target.value })} /></label>
              <label>Moneda<select value={draft.currency} onChange={(event) => setDraft({ ...draft, currency: event.target.value })}><option value="PEN">PEN · Sol peruano</option><option value="MXN">MXN · Peso mexicano</option><option value="USD">USD · Dólar</option><option value="COP">COP · Peso colombiano</option><option value="CLP">CLP · Peso chileno</option></select></label>
              <label>Referencia externa<input value={draft.externalReference} onChange={(event) => setDraft({ ...draft, externalReference: event.target.value })} placeholder="Cotización u orden del proveedor" /></label>
            </div>

            <div className="purchase-items-heading"><h3>Productos</h3><button type="button" className="btn-quiet" onClick={() => setDraft({ ...draft, items: [...draft.items, newLine()] })}>＋ Agregar producto</button></div>
            {draft.items.map((item, index) => {
              const product = products.find((candidate) => candidate.id === item.productId);
              const lineAmount = Math.max(0, (Number(item.quantityOrdered) || 0) * (Number(item.unitCost) || 0) - (Number(item.discount) || 0));
              return (
                <fieldset className="purchase-item" key={item.key}>
                  <legend>Partida {index + 1}</legend>
                  <div className="purchase-item-grid">
                    <label className="purchase-product-field">Producto<select required value={item.productId} onChange={(event) => {
                      const nextProduct = products.find((candidate) => candidate.id === event.target.value);
                      updateLine(item.key, { productId: event.target.value, unitCost: nextProduct?.cost != null ? String(nextProduct.cost) : item.unitCost });
                    }}><option value="">Seleccionar producto...</option>{products.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}{candidate.sku ? ` · ${candidate.sku}` : ''}</option>)}</select></label>
                    <label>Cantidad<input required min="0.0001" step="any" type="number" value={item.quantityOrdered} onChange={(event) => updateLine(item.key, { quantityOrdered: event.target.value })} /></label>
                    <label>Costo unitario<input required min="0" step="0.0001" type="number" value={item.unitCost} onChange={(event) => updateLine(item.key, { unitCost: event.target.value })} /></label>
                    <label>Descuento línea<input min="0" step="0.01" type="number" value={item.discount} onChange={(event) => updateLine(item.key, { discount: event.target.value })} /></label>
                    <label>Impuesto %<input min="0" max="100" step="0.01" type="number" value={(Number(item.taxRate) || 0) * 100} onChange={(event) => updateLine(item.key, { taxRate: String((Number(event.target.value) || 0) / 100) })} /></label>
                    <div className="purchase-line-total"><span>Base de línea</span><strong>{money(lineAmount, draft.currency)}</strong></div>
                    <label>Lote (opcional)<input value={item.batchNumber} onChange={(event) => updateLine(item.key, { batchNumber: event.target.value })} /></label>
                    <label>Vencimiento (opcional)<input type="date" value={item.expirationDate} onChange={(event) => updateLine(item.key, { expirationDate: event.target.value })} /></label>
                    <label className="purchase-notes-field">Nota de partida<input value={item.notes} onChange={(event) => updateLine(item.key, { notes: event.target.value })} /></label>
                  </div>
                  {product?.unit && <p className="muted purchase-unit-hint">Unidad: {product.unit.name}{product.unit.symbol ? ` (${product.unit.symbol})` : ''}</p>}
                  {draft.items.length > 1 && <button type="button" className="btn-quiet danger-action" onClick={() => setDraft({ ...draft, items: draft.items.filter((line) => line.key !== item.key) })}>Quitar partida</button>}
                </fieldset>
              );
            })}

            <div className="purchase-form-grid">
              <label>Descuento global<input min="0" step="0.01" type="number" value={draft.discount} onChange={(event) => setDraft({ ...draft, discount: event.target.value })} /></label>
              <label>Notas para proveedor<textarea rows={2} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label>
              <label>Notas internas<textarea rows={2} value={draft.internalNotes} onChange={(event) => setDraft({ ...draft, internalNotes: event.target.value })} /></label>
            </div>
            <div className="purchase-totals">
              <span>Subtotal <strong>{money(totals.subtotal, draft.currency)}</strong></span>
              <span>Impuestos <strong>{money(totals.tax, draft.currency)}</strong></span>
              <span>Total estimado <strong>{money(totals.total, draft.currency)}</strong></span>
            </div>
            <div className="platform-actions">
              <button type="submit" disabled={busy || !suppliers.length || !products.length}>{busy ? 'Guardando...' : draft.id ? 'Guardar borrador' : 'Crear borrador'}</button>
              <button type="button" className="btn-quiet" onClick={() => setDraft(null)}>Cancelar</button>
            </div>
          </form>
          {(!suppliers.length || !products.length) && <p className="muted">Para crear una orden necesitas al menos un proveedor y un producto activos.</p>}
        </section>
      )}

      {selected && !draft && (
        <section className="panel purchase-detail">
          <div className="panel-heading">
            <div><span className="eyebrow">Detalle de orden</span><h2>{selected.orderNumber}</h2><span className={statusClass(selected.status)}>{STATUS_LABELS[selected.status] ?? selected.status}</span></div>
            <div className="platform-actions">
              {selected.status === 'BORRADOR' && canEdit && <button type="button" className="btn-quiet" onClick={() => startEdit(selected)}>Editar borrador</button>}
              {['ENVIADA', 'CONFIRMADA', 'PARCIALMENTE_RECIBIDA'].includes(selected.status) && canEdit && <button type="button" onClick={() => startReceive(selected)}>Registrar recepción</button>}
              {selected.status === 'BORRADOR' && canEdit && <button type="button" className="btn-quiet" onClick={() => void changeStatus(selected, 'ENVIADA')}>Marcar enviada</button>}
              {selected.status === 'ENVIADA' && canEdit && <button type="button" className="btn-quiet" onClick={() => void changeStatus(selected, 'CONFIRMADA')}>Confirmar</button>}
              {['BORRADOR', 'ENVIADA', 'CONFIRMADA', 'PARCIALMENTE_RECIBIDA'].includes(selected.status) && canEdit && <button type="button" className="btn-quiet danger-action" disabled={busy} onClick={() => {
                if (window.confirm(`¿Cancelar la orden ${selected.orderNumber}?`)) void changeStatus(selected, 'CANCELADA');
              }}>Cancelar orden</button>}
              {selected.status === 'BORRADOR' && canDelete && <button type="button" className="btn-quiet danger-action" onClick={() => void deleteDraft(selected)}>Eliminar borrador</button>}
              <button type="button" className="btn-quiet" onClick={() => { setSelected(null); setReceiveDraft(null); }}>Cerrar detalle</button>
            </div>
          </div>
          <div className="purchase-summary-grid">
            <div><span>Proveedor</span><strong>{selected.supplier?.name ?? 'Proveedor'}</strong></div>
            <div><span>Fecha de orden</span><strong>{formatDate(selected.orderDate)}</strong></div>
            <div><span>Entrega esperada</span><strong>{formatDate(selected.expectedDeliveryDate)}</strong></div>
            <div><span>Término de pago</span><strong>{PAYMENT_TERMS[selected.paymentTerm] ?? selected.paymentTerm}</strong></div>
            <div><span>Referencia</span><strong>{selected.externalReference || '—'}</strong></div>
          </div>
          <div className="platform-table-wrap">
            <table className="platform-table purchase-table">
              <thead><tr><th>Producto</th><th>Ordenado</th><th>Recibido</th><th>Pendiente</th><th>Costo</th><th>Impuesto</th><th>Total</th></tr></thead>
              <tbody>{selected.items.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.product.name}</strong>{item.product.sku && <small>{item.product.sku}</small>}{item.batchNumber && <small>Lote: {item.batchNumber}</small>}</td>
                  <td>{Number(item.quantityOrdered)}</td>
                  <td>{Number(item.quantityReceived)}</td>
                  <td>{Math.max(0, Number(item.quantityOrdered) - Number(item.quantityReceived))}</td>
                  <td>{money(item.unitCost, selected.currency)}</td>
                  <td>{(Number(item.taxRate) * 100).toFixed(2)}%</td>
                  <td>{money(item.total, selected.currency)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="purchase-totals purchase-detail-totals">
            <span>Subtotal <strong>{money(selected.subtotal, selected.currency)}</strong></span>
            <span>Impuesto <strong>{money(selected.taxAmount, selected.currency)}</strong></span>
            <span>Descuento <strong>{money(selected.discount, selected.currency)}</strong></span>
            <span>Total <strong>{money(selected.total, selected.currency)}</strong></span>
          </div>
          {(selected.notes || selected.internalNotes) && <div className="purchase-notes"><p><strong>Notas:</strong> {selected.notes || '—'}</p><p><strong>Internas:</strong> {selected.internalNotes || '—'}</p></div>}

          {receiveDraft && (
            <form className="purchase-receive" onSubmit={receiveOrder}>
              <div className="panel-heading"><div><span className="eyebrow">Entrada a inventario</span><h3>Registrar recepción</h3></div></div>
              <div className="platform-table-wrap">
                <table className="platform-table purchase-table">
                  <thead><tr><th>Producto</th><th>Pendiente</th><th>Recibir ahora</th><th>Lote</th><th>Vencimiento</th></tr></thead>
                  <tbody>{selected.items.map((item) => {
                    const pending = Math.max(0, Number(item.quantityOrdered) - Number(item.quantityReceived));
                    const current = receiveDraft[item.id];
                    return <tr key={item.id}>
                      <td>{item.product.name}</td><td>{pending}</td>
                      <td><input aria-label={`Cantidad recibida de ${item.product.name}`} type="number" min="0" max={pending} step="any" disabled={!pending} value={current?.quantity ?? ''} onChange={(event) => setReceiveDraft({ ...receiveDraft, [item.id]: { ...current, quantity: event.target.value } })} /></td>
                      <td><input aria-label={`Lote de ${item.product.name}`} value={current?.batchNumber ?? ''} onChange={(event) => setReceiveDraft({ ...receiveDraft, [item.id]: { ...current, batchNumber: event.target.value } })} /></td>
                      <td><input aria-label={`Vencimiento de ${item.product.name}`} type="date" value={current?.expirationDate ?? ''} onChange={(event) => setReceiveDraft({ ...receiveDraft, [item.id]: { ...current, expirationDate: event.target.value } })} /></td>
                    </tr>;
                  })}</tbody>
                </table>
              </div>
              <div className="platform-actions">
                <button type="submit" disabled={busy}>{busy ? 'Registrando...' : 'Registrar e ingresar al inventario'}</button>
                <button type="button" className="btn-quiet" onClick={() => setReceiveDraft(null)}>Cerrar recepción</button>
              </div>
            </form>
          )}
        </section>
      )}
    </OwnerShell>
  );
}