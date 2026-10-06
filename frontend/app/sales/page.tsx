'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError, apiFetch } from '@/lib/api';

type Product = { id: string; name: string; sku?: string | null; price: number | string; isActive: boolean; unit?: { name: string; symbol?: string | null } | null };
type Customer = { id: string; name: string; entityType: string; taxId?: string | null; isActive: boolean };
type SaleItem = { id: string; productId: string; product: Product; quantity: number | string; unitPrice: number | string; discount: number | string; taxRate: number | string; subtotal: number | string; taxAmount: number | string; total: number | string };
type Payment = { id: string; amount: number | string; method: string; paymentDate: string; bankName?: string | null; transactionId?: string | null; notes?: string | null };
type ElectronicDocument = { id: string; type: 'TICKET' | 'BOLETA' | 'FACTURA'; series: string; number: number; status: string; provider: string; message?: string | null; pdfUrl?: string | null; xmlUrl?: string | null; cdrUrl?: string | null; qrData?: string | null; issuedAt?: string | null };
type YapeAccount = { id: string; provider: 'YAPE' | 'PLIN'; label: string; phone: string; holder?: string; code?: string; qrImageUrl?: string; enabled?: boolean };
type BillingSettings = { fiscal?: { ruc?: string; legalName?: string; address?: string }; yapeAccounts?: YapeAccount[] };
type BusinessSettings = { name: string; settings?: { billing?: BillingSettings } };
type Sale = {
  id: string; saleNumber: string; status: string; type: string; saleDate: string; deliveryDate?: string | null;
  customerId?: string | null; customer?: Customer | null; paymentTerm: string; paymentDueDate?: string | null;
  subtotal: number | string; taxAmount: number | string; discount: number | string; total: number | string;
  amountPaid: number | string; amountPending: number | string; currency: string; notes?: string | null;
  internalNotes?: string | null; items: SaleItem[]; payments?: Payment[];
  electronicDocuments?: ElectronicDocument[];
};
type CartLine = { key: string; productId: string; quantity: string; unitPrice: string; discount: string; taxRate: string };

const STATUS_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador', CONFIRMADA: 'Confirmada', EN_PROCESO: 'En proceso',
  COMPLETADA: 'Completada', CANCELADA: 'Cancelada', DEVUELTA_PARCIAL: 'Devolución parcial', DEVUELTA_TOTAL: 'Devuelta',
};
const PAYMENT_METHODS: Record<string, string> = {
  EFECTIVO: 'Efectivo', TARJETA_CREDITO: 'Tarjeta de crédito', TARJETA_DEBITO: 'Tarjeta de débito',
  TRANSFERENCIA: 'Transferencia', YAPE_PLIN: 'Yape / Plin', CHEQUE: 'Cheque', CREDITO_EMPRESA: 'Crédito empresa',
};
const PAYMENT_TERMS: Record<string, string> = {
  CONTADO: 'Contado', CREDITO_7_DIAS: 'Crédito 7 días', CREDITO_15_DIAS: 'Crédito 15 días',
  CREDITO_30_DIAS: 'Crédito 30 días', CREDITO_60_DIAS: 'Crédito 60 días', CREDITO_90_DIAS: 'Crédito 90 días', PERSONALIZADO: 'Personalizado',
};
const DOCUMENT_LABELS: Record<ElectronicDocument['type'], string> = { TICKET: 'Ticket', BOLETA: 'Boleta electrónica', FACTURA: 'Factura electrónica' };
const DOCUMENT_STATUS: Record<string, string> = { LOCAL: 'Local', PENDIENTE: 'Procesando', ACEPTADO: 'Aceptado por SUNAT', RECHAZADO: 'Rechazado por SUNAT', ERROR: 'Error de conexión' };
const WRITE_ROLES = ['OWNER', 'ADMIN', 'VENDEDOR'];
const TAX_RATE = 0.18;

const newCartLine = (product?: Product): CartLine => ({
  key: crypto.randomUUID(), productId: product?.id ?? '', quantity: '1',
  unitPrice: product ? String(product.price) : '', discount: '0', taxRate: String(TAX_RATE),
});

function money(value: number | string, currency: string) {
  try { return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(Number(value) || 0); }
  catch { return `${currency} ${(Number(value) || 0).toFixed(2)}`; }
}

function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function saleStatusClass(status: string) { return `sale-status sale-status-${status.toLowerCase()}`; }

export default function SalesPage() {
  const { token, organizationId, orgRole, memberships } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [billing, setBilling] = useState<BillingSettings>({});
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [globalDiscount, setGlobalDiscount] = useState('0');
  const [currency, setCurrency] = useState('PEN');
  const [paymentTerm, setPaymentTerm] = useState('CONTADO');
  const [notes, setNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [selected, setSelected] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
  const [paymentReference, setPaymentReference] = useState('');
  const [yapeAccountId, setYapeAccountId] = useState('');
  const [documentType, setDocumentType] = useState<ElectronicDocument['type']>('TICKET');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token || !organizationId) return;
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (customerFilter) params.set('customerId', customerFilter);
      const query = params.toString();
      const [saleRows, productRows, customerRows, organization] = await Promise.all([
        apiFetch<Sale[]>(`/sales${query ? `?${query}` : ''}`, { token, organizationId }),
        apiFetch<Product[]>('/products', { token, organizationId }),
        apiFetch<Customer[]>('/business-entities', { token, organizationId }),
        apiFetch<BusinessSettings>(`/organizations/${organizationId}`, { token, organizationId }),
      ]);
      setSales(saleRows);
      setProducts(productRows.filter((product) => product.isActive));
      setCustomers(customerRows.filter((customer) => customer.isActive && ['CLIENTE', 'AMBOS'].includes(customer.entityType)));
      setBilling(organization.settings?.billing ?? {});
      if (selected) {
        const refreshed = saleRows.find((sale) => sale.id === selected.id);
        if (refreshed) setSelected(refreshed);
      }
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudieron cargar las ventas');
    } finally {
      setLoading(false);
    }
  }, [token, organizationId, statusFilter, customerFilter, selected?.id]);

  useEffect(() => { void load(); }, [load]);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0), 0);
    const lineDiscounts = cart.reduce((sum, line) => sum + (Number(line.discount) || 0), 0);
    const tax = cart.reduce((sum, line) => {
      const base = Math.max(0, (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0) - (Number(line.discount) || 0));
      return sum + base * (Number(line.taxRate) || 0);
    }, 0);
    const discount = lineDiscounts + (Number(globalDiscount) || 0);
    return { subtotal, tax, discount, total: subtotal + tax - discount };
  }, [cart, globalDiscount]);

  function startSale() {
    setSelected(null);
    setCart([newCartLine(products[0])]);
    setCustomerId('');
    setGlobalDiscount('0');
    setCurrency('PEN');
    setPaymentTerm('CONTADO');
    setNotes('');
    setInternalNotes('');
    setError('');
    setNotice('');
  }

  function updateCartLine(key: string, changes: Partial<CartLine>) {
    setCart((current) => current.map((line) => line.key === key ? { ...line, ...changes } : line));
  }

  async function refreshSelected(saleId: string) {
    if (!token || !organizationId) return;
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (customerFilter) params.set('customerId', customerFilter);
    const query = params.toString();
    const [detail, rows] = await Promise.all([
      apiFetch<Sale>(`/sales/${saleId}`, { token, organizationId }),
      apiFetch<Sale[]>(`/sales${query ? `?${query}` : ''}`, { token, organizationId }),
    ]);
    setSelected(detail);
    setSales(rows);
  }

  async function openSale(sale: Sale) {
    if (!token || !organizationId) return;
    setError('');
    setCart([]);
    try {
      setSelected(await apiFetch<Sale>(`/sales/${sale.id}`, { token, organizationId }));
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo abrir el detalle de venta');
    }
  }

  async function createSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !organizationId) return;
    if (!cart.length || cart.some((line) => !line.productId || Number(line.quantity) <= 0 || Number(line.unitPrice) < 0)) {
      setError('Agrega productos y revisa cantidades y precios.');
      return;
    }
    const productIds = cart.map((line) => line.productId);
    if (new Set(productIds).size !== productIds.length) {
      setError('Cada producto debe aparecer una sola vez. Ajusta la cantidad en su partida.');
      return;
    }
    if (totals.total < 0) {
      setError('El descuento global supera el importe de la venta.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const sale = await apiFetch<Sale>('/sales', {
        method: 'POST', token, organizationId,
        body: JSON.stringify({
          customerId: customerId || undefined,
          paymentTerm,
          currency,
          discount: Number(globalDiscount) || 0,
          notes: notes || undefined,
          internalNotes: internalNotes || undefined,
          items: cart.map((line) => ({
            productId: line.productId,
            quantity: Number(line.quantity),
            unitPrice: Number(line.unitPrice),
            discount: Number(line.discount) || 0,
            taxRate: Number(line.taxRate) || 0,
          })),
        }),
      });
      setSelected(sale);
      setCart([]);
      setNotice(`Venta ${sale.saleNumber} creada como borrador.`);
      await load();
      setSelected(sale);
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo registrar la venta');
    } finally {
      setBusy(false);
    }
  }

  async function confirmSale(sale: Sale) {
    if (!token || !organizationId) return;
    setBusy(true);
    setError('');
    try {
      await apiFetch(`/sales/${sale.id}`, { method: 'PATCH', token, organizationId, body: JSON.stringify({ status: 'CONFIRMADA' }) });
      await refreshSelected(sale.id);
      setNotice('Venta confirmada. Ya puedes completar el despacho o registrar pagos.');
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo confirmar la venta');
    } finally { setBusy(false); }
  }

  async function completeSale(sale: Sale) {
    if (!token || !organizationId || !window.confirm(`¿Completar ${sale.saleNumber} y descontar sus productos del inventario?`)) return;
    setBusy(true);
    setError('');
    try {
      await apiFetch(`/sales/${sale.id}/complete`, { method: 'POST', token, organizationId });
      await refreshSelected(sale.id);
      setNotice('Venta completada e inventario actualizado.');
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo completar la venta');
    } finally { setBusy(false); }
  }

  async function collectPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !organizationId || !selected) return;
    setBusy(true);
    setError('');
    try {
      const selectedYape = billing.yapeAccounts?.find((account) => account.id === yapeAccountId && account.enabled !== false);
      if (paymentMethod === 'YAPE_PLIN' && billing.yapeAccounts?.some((account) => account.enabled !== false) && !selectedYape) {
        throw new ApiError('Selecciona la cuenta Yape/Plin donde se recibió el pago', 400);
      }
      await apiFetch(`/sales/${selected.id}/payment`, {
        method: 'POST', token, organizationId,
        body: JSON.stringify({
          amount: Number(paymentAmount),
          method: paymentMethod,
          transactionId: paymentReference || undefined,
          bankName: selectedYape ? `${selectedYape.provider} · ${selectedYape.label}` : undefined,
          notes: selectedYape ? `Cuenta: ${selectedYape.phone}${selectedYape.code ? ` · Código: ${selectedYape.code}` : ''}` : undefined,
        }),
      });
      await refreshSelected(selected.id);
      setPaymentAmount('');
      setPaymentReference('');
      setNotice('Pago registrado y saldo actualizado.');
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo registrar el pago');
    } finally { setBusy(false); }
  }

  async function cancelSale(sale: Sale) {
    if (!token || !organizationId || !window.confirm(`¿Cancelar ${sale.saleNumber}? Las ventas pagadas o completadas requieren un reembolso.`)) return;
    setBusy(true);
    setError('');
    try {
      await apiFetch(`/sales/${sale.id}/cancel`, { method: 'POST', token, organizationId });
      await refreshSelected(sale.id);
      setNotice('Venta cancelada.');
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo cancelar la venta');
    } finally { setBusy(false); }
  }

  async function deleteDraft(sale: Sale) {
    if (!token || !organizationId || !window.confirm(`¿Eliminar el borrador ${sale.saleNumber}?`)) return;
    setBusy(true);
    try {
      await apiFetch(`/sales/${sale.id}`, { method: 'DELETE', token, organizationId });
      setSelected(null);
      setNotice('Borrador eliminado.');
      await load();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo eliminar el borrador');
    } finally { setBusy(false); }
  }

  async function issueDocument() {
    if (!token || !organizationId || !selected) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const document = await apiFetch<ElectronicDocument>(`/billing/sales/${selected.id}/documents`, {
        method: 'POST', token, organizationId, body: JSON.stringify({ type: documentType }),
      });
      await refreshSelected(selected.id);
      setNotice(document.status === 'ACEPTADO' ? `${DOCUMENT_LABELS[document.type]} ${document.series}-${document.number} aceptada por SUNAT.` : `${DOCUMENT_LABELS[document.type]} ${document.series}-${document.number} generada: ${DOCUMENT_STATUS[document.status] ?? document.status}.`);
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo emitir el comprobante');
    } finally { setBusy(false); }
  }

  const canWrite = orgRole !== null && WRITE_ROLES.includes(orgRole);

  return (
    <OwnerShell active="sales">
      <OwnerHeader eyebrow="Operación" title="Ventas" />
      {error && <p className="error-message" role="alert">{error}</p>}
      {notice && <p className="success-message" role="status">{notice}</p>}

      <section className="panel sales-history">
        <div className="panel-heading">
          <div><span className="eyebrow">Operación</span><h2>Historial de ventas</h2></div>
          {canWrite && <button type="button" onClick={startSale}>＋ Nueva venta</button>}
        </div>
        <div className="sales-filters">
          <label>Estado<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <label>Cliente<select value={customerFilter} onChange={(event) => setCustomerFilter(event.target.value)}>
            <option value="">Todos los clientes</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </select></label>
          <span className="role-badge">{sales.length} ventas</span>
        </div>
        {loading ? <p className="loading-message">Cargando ventas...</p> : sales.length ? (
          <div className="platform-table-wrap">
            <table className="platform-table sales-table">
              <thead><tr><th>Venta</th><th>Cliente</th><th>Fecha</th><th>Estado</th><th>Pagado</th><th>Pendiente</th><th>Total</th></tr></thead>
              <tbody>{sales.map((sale) => (
                <tr key={sale.id} className={selected?.id === sale.id ? 'sale-row-selected' : ''}>
                  <td><button type="button" className="sale-number-link" onClick={() => void openSale(sale)}>{sale.saleNumber}</button></td>
                  <td>{sale.customer?.name ?? 'Venta mostrador'}</td>
                  <td>{formatDate(sale.saleDate)}</td>
                  <td><span className={saleStatusClass(sale.status)}>{STATUS_LABELS[sale.status] ?? sale.status}</span></td>
                  <td>{money(sale.amountPaid, sale.currency)}</td>
                  <td>{money(sale.amountPending, sale.currency)}</td>
                  <td><strong>{money(sale.total, sale.currency)}</strong></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="muted">No hay ventas para los filtros seleccionados.</p>}
      </section>

      {cart.length > 0 && (
        <section className="panel sale-editor">
          <div className="panel-heading">
            <div><span className="eyebrow">Nueva operación</span><h2>Registrar venta</h2></div>
            <button type="button" className="btn-quiet" onClick={() => setCart([])}>Cerrar</button>
          </div>
          <form className="sale-form" onSubmit={createSale}>
            <div className="sales-form-grid">
              <label>Cliente (opcional)<select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
                <option value="">Venta mostrador</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}{customer.taxId ? ` · ${customer.taxId}` : ''}</option>)}
              </select></label>
              <label>Término de pago<select value={paymentTerm} onChange={(event) => setPaymentTerm(event.target.value)}>
                {Object.entries(PAYMENT_TERMS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select></label>
              <label>Moneda<select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                <option value="PEN">PEN · Sol peruano</option><option value="MXN">MXN · Peso mexicano</option>
                <option value="USD">USD · Dólar</option><option value="COP">COP · Peso colombiano</option><option value="CLP">CLP · Peso chileno</option>
              </select></label>
            </div>
            <div className="sale-items-heading"><h3>Productos</h3><button type="button" className="btn-quiet" onClick={() => setCart([...cart, newCartLine(products.find((product) => !cart.some((line) => line.productId === product.id)))])} disabled={cart.length >= products.length}>＋ Agregar producto</button></div>
            {cart.map((line, index) => {
              const lineProduct = products.find((product) => product.id === line.productId);
              const lineBase = Math.max(0, (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0) - (Number(line.discount) || 0));
              return <fieldset className="sale-cart-line" key={line.key}>
                <legend>Partida {index + 1}</legend>
                <div className="sale-line-grid">
                  <label className="sale-product-field">Producto<select required value={line.productId} onChange={(event) => {
                    const product = products.find((item) => item.id === event.target.value);
                    updateCartLine(line.key, { productId: event.target.value, unitPrice: product ? String(product.price) : '' });
                  }}><option value="">Seleccionar...</option>{products.filter((product) => product.id === line.productId || !cart.some((other) => other.productId === product.id)).map((product) => <option key={product.id} value={product.id}>{product.name}{product.sku ? ` · ${product.sku}` : ''}</option>)}</select></label>
                  <label>Cantidad<input required type="number" min="0.0001" step="any" value={line.quantity} onChange={(event) => updateCartLine(line.key, { quantity: event.target.value })} /></label>
                  <label>Precio unitario<input required type="number" min="0" step="0.01" value={line.unitPrice} onChange={(event) => updateCartLine(line.key, { unitPrice: event.target.value })} /></label>
                  <label>Descuento<input type="number" min="0" step="0.01" value={line.discount} onChange={(event) => updateCartLine(line.key, { discount: event.target.value })} /></label>
                  <label>Impuesto %<input type="number" min="0" max="100" step="0.01" value={(Number(line.taxRate) || 0) * 100} onChange={(event) => updateCartLine(line.key, { taxRate: String((Number(event.target.value) || 0) / 100) })} /></label>
                  <div className="sale-line-amount"><span>Base</span><strong>{money(lineBase, currency)}</strong></div>
                </div>
                {lineProduct?.unit && <small className="muted">Unidad: {lineProduct.unit.name}{lineProduct.unit.symbol ? ` (${lineProduct.unit.symbol})` : ''}</small>}
                {cart.length > 1 && <button type="button" className="btn-quiet danger-action" onClick={() => setCart(cart.filter((item) => item.key !== line.key))}>Quitar</button>}
              </fieldset>;
            })}
            <div className="sales-form-grid">
              <label>Descuento global<input type="number" min="0" step="0.01" value={globalDiscount} onChange={(event) => setGlobalDiscount(event.target.value)} /></label>
              <label>Notas para el cliente<textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
              <label>Notas internas<textarea rows={2} value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} /></label>
            </div>
            <div className="sale-totals">
              <span>Subtotal<strong>{money(totals.subtotal, currency)}</strong></span>
              <span>Descuentos<strong>{money(totals.discount, currency)}</strong></span>
              <span>Impuestos<strong>{money(totals.tax, currency)}</strong></span>
              <span>Total<strong>{money(totals.total, currency)}</strong></span>
            </div>
            <div className="platform-actions">
              <button type="submit" disabled={busy || !products.length}>{busy ? 'Guardando...' : 'Guardar borrador'}</button>
              <button type="button" className="btn-quiet" onClick={() => setCart([])}>Descartar</button>
            </div>
            {!products.length && <p className="muted">Registra primero productos activos para crear ventas.</p>}
          </form>
        </section>
      )}

      {selected && cart.length === 0 && (
        <section className="panel sale-detail">
          <div className="panel-heading">
            <div><span className="eyebrow">Detalle de venta</span><h2>{selected.saleNumber}</h2><span className={saleStatusClass(selected.status)}>{STATUS_LABELS[selected.status] ?? selected.status}</span></div>
            <div className="platform-actions">
              {selected.status === 'BORRADOR' && canWrite && <button type="button" onClick={() => void confirmSale(selected)} disabled={busy}>Confirmar venta</button>}
              {selected.status === 'CONFIRMADA' && canWrite && <button type="button" onClick={() => void completeSale(selected)} disabled={busy}>Completar y descontar inventario</button>}
              {['CONFIRMADA', 'COMPLETADA'].includes(selected.status) && Number(selected.amountPending) > 0 && canWrite && <button type="button" className="btn-quiet" onClick={() => setPaymentAmount(String(selected.amountPending))}>Registrar pago</button>}
              {['BORRADOR', 'CONFIRMADA'].includes(selected.status) && Number(selected.amountPaid) === 0 && canWrite && <button type="button" className="btn-quiet danger-action" onClick={() => void cancelSale(selected)} disabled={busy}>Cancelar</button>}
              {selected.status === 'BORRADOR' && orgRole && ['OWNER', 'ADMIN'].includes(orgRole) && <button type="button" className="btn-quiet danger-action" onClick={() => void deleteDraft(selected)} disabled={busy}>Eliminar borrador</button>}
              <button type="button" className="btn-quiet" onClick={() => setSelected(null)}>Cerrar detalle</button>
            </div>
          </div>
          <div className="sale-summary-grid">
            <div><span>Cliente</span><strong>{selected.customer?.name ?? 'Venta mostrador'}</strong></div>
            <div><span>Fecha</span><strong>{formatDate(selected.saleDate)}</strong></div>
            <div><span>Término</span><strong>{PAYMENT_TERMS[selected.paymentTerm] ?? selected.paymentTerm}</strong></div>
            <div><span>Pagado</span><strong>{money(selected.amountPaid, selected.currency)}</strong></div>
            <div><span>Saldo</span><strong>{money(selected.amountPending, selected.currency)}</strong></div>
          </div>
          <div className="platform-table-wrap">
            <table className="platform-table sales-table"><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Descuento</th><th>Impuesto</th><th>Total</th></tr></thead>
              <tbody>{selected.items.map((item) => <tr key={item.id}>
                <td><strong>{item.product.name}</strong>{item.product.sku && <small>{item.product.sku}</small>}</td>
                <td>{Number(item.quantity)}</td><td>{money(item.unitPrice, selected.currency)}</td>
                <td>{money(item.discount, selected.currency)}</td><td>{(Number(item.taxRate) * 100).toFixed(2)}%</td><td>{money(item.total, selected.currency)}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <div className="sale-totals sale-detail-totals">
            <span>Subtotal<strong>{money(selected.subtotal, selected.currency)}</strong></span>
            <span>Descuento<strong>{money(selected.discount, selected.currency)}</strong></span>
            <span>Impuestos<strong>{money(selected.taxAmount, selected.currency)}</strong></span>
            <span>Total<strong>{money(selected.total, selected.currency)}</strong></span>
          </div>
          {selected.payments?.length ? <div className="sale-payments">
            <h3>Pagos</h3>
            {selected.payments.map((payment) => <div className="sale-payment-row" key={payment.id}>
              <span>{PAYMENT_METHODS[payment.method] ?? payment.method}<small>{payment.bankName ? `${payment.bankName} · ` : ''}{formatDate(payment.paymentDate)}{payment.transactionId ? ` · ${payment.transactionId}` : ''}{payment.notes ? ` · ${payment.notes}` : ''}</small></span>
              <strong>{money(payment.amount, selected.currency)}</strong>
            </div>)}
          </div> : null}
          <section className="sale-electronic-documents">
            <div className="panel-heading"><div><span className="eyebrow">Documentos</span><h3>Comprobantes de venta</h3></div></div>
            {selected.electronicDocuments?.map((document) => <div className="sale-document-row" key={document.id}>
              <span><strong>{DOCUMENT_LABELS[document.type]} {document.series}-{String(document.number).padStart(6, '0')}</strong><small>{DOCUMENT_STATUS[document.status] ?? document.status}{document.message ? ` · ${document.message}` : ''}</small></span>
              <span className="platform-actions">
                {document.pdfUrl && <a className="quiet-link" href={document.pdfUrl} target="_blank" rel="noreferrer">PDF</a>}
                {document.xmlUrl && <a className="quiet-link" href={document.xmlUrl} target="_blank" rel="noreferrer">XML</a>}
                {document.cdrUrl && <a className="quiet-link" href={document.cdrUrl} target="_blank" rel="noreferrer">CDR</a>}
                {document.type === 'TICKET' && <button type="button" className="btn-quiet" onClick={() => window.print()}>Imprimir ticket</button>}
              </span>
            </div>)}
            {!selected.electronicDocuments?.length && <p className="muted">Aún no se emitió comprobante para esta venta.</p>}
            {['CONFIRMADA', 'COMPLETADA'].includes(selected.status) && canWrite && !selected.electronicDocuments?.length && (
              <div className="sale-issue-document">
                <label>Tipo<select value={documentType} onChange={(event) => setDocumentType(event.target.value as ElectronicDocument['type'])}><option value="TICKET">Ticket interno</option><option value="BOLETA">Boleta electrónica (SUNAT)</option><option value="FACTURA">Factura electrónica (SUNAT)</option></select></label>
                <button type="button" disabled={busy} onClick={() => void issueDocument()}>{busy ? 'Emitiendo...' : documentType === 'TICKET' ? 'Generar ticket' : 'Emitir en Nubefact / SUNAT'}</button>
              </div>
            )}
          </section>
          {selected.electronicDocuments?.some((document) => document.type === 'TICKET') && <div className="printable-receipt">
            <header><strong>{memberships.find((membership) => membership.organizationId === organizationId)?.organization?.name ?? 'Negocio'}</strong><span>{billing.fiscal?.legalName}</span>{billing.fiscal?.ruc && <span>RUC: {billing.fiscal.ruc}</span>}{billing.fiscal?.address && <span>{billing.fiscal.address}</span>}</header>
            <h2>TICKET {selected.electronicDocuments.find((document) => document.type === 'TICKET')?.series}-{String(selected.electronicDocuments.find((document) => document.type === 'TICKET')?.number ?? '').padStart(6, '0')}</h2>
            <p>Venta {selected.saleNumber} · {formatDate(selected.saleDate)}</p>
            <p>Cliente: {selected.customer?.name ?? 'Venta mostrador'}</p>
            {selected.items.map((item) => <div className="receipt-item" key={item.id}><span>{Number(item.quantity)} × {item.product.name}</span><strong>{money(item.total, selected.currency)}</strong></div>)}
            <div className="receipt-total"><span>TOTAL</span><strong>{money(selected.total, selected.currency)}</strong></div>
            <p>Gracias por su compra</p>
          </div>}
          {(selected.notes || selected.internalNotes) && <div className="sale-notes"><p><strong>Nota:</strong> {selected.notes || '—'}</p><p><strong>Internas:</strong> {selected.internalNotes || '—'}</p></div>}
          {paymentAmount !== '' && ['CONFIRMADA', 'COMPLETADA'].includes(selected.status) && Number(selected.amountPending) > 0 && (
            <form className="sale-payment-form" onSubmit={collectPayment}>
              <div className="panel-heading"><div><span className="eyebrow">Caja</span><h3>Registrar pago</h3></div></div>
              <div className="sales-form-grid">
                <label>Monto<input required type="number" min="0.01" max={Number(selected.amountPending)} step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} /></label>
                <label>Método<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>{Object.entries(PAYMENT_METHODS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label>Referencia<input value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="N.º de operación (opcional)" /></label>
              </div>
              {paymentMethod === 'YAPE_PLIN' && <div className="yape-payment-options">
                {billing.yapeAccounts?.filter((account) => account.enabled !== false).length ? <>
                  <label>Cuenta receptora<select required value={yapeAccountId} onChange={(event) => setYapeAccountId(event.target.value)}><option value="">Selecciona la cuenta...</option>{billing.yapeAccounts.filter((account) => account.enabled !== false).map((account) => <option key={account.id} value={account.id}>{account.provider} · {account.label} · {account.phone}</option>)}</select></label>
                  {billing.yapeAccounts.filter((account) => account.id === yapeAccountId).map((account) => <div className="yape-payment-card" key={account.id}><div><strong>{account.provider} · {account.label}</strong><span>{account.phone}{account.holder ? ` · ${account.holder}` : ''}</span>{account.code && <span>Código: {account.code}</span>}</div>{account.qrImageUrl && <img src={account.qrImageUrl} alt={`QR de ${account.label}`} />}</div>)}
                </> : <p className="muted">No hay cuentas Yape/Plin configuradas. Agrégalas en Configuración.</p>}
              </div>}
              <div className="platform-actions"><button type="submit" disabled={busy}>{busy ? 'Registrando...' : 'Guardar pago'}</button><button type="button" className="btn-quiet" onClick={() => setPaymentAmount('')}>Cancelar</button></div>
            </form>
          )}
        </section>
      )}
    </OwnerShell>
  );
}