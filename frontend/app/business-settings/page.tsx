'use client';

import { FormEvent, useEffect, useState } from 'react';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError, apiFetch } from '@/lib/api';

type YapeAccount = {
  id: string;
  provider: 'YAPE' | 'PLIN';
  label: string;
  phone: string;
  holder: string;
  code: string;
  qrImageUrl: string;
  enabled: boolean;
};
type Organization = {
  id: string;
  name: string;
  enabledModules: unknown;
  settings: Record<string, unknown>;
  businessType: { id: string; name: string; code: string; defaultModules: unknown };
};
type NubefactStatus = { configured: boolean; endpointUrl: string | null; endpointHost: string | null; tokenConfigured: boolean; encryptionKeyConfigured: boolean; updatedAt: string | null };

const availableModules = ['inventario', 'ventas', 'compras', 'caja'];
const defaultSeries = { ticket: 'T001', ticketNextNumber: 1, boleta: 'B001', boletaNextNumber: 1, factura: 'F001', facturaNextNumber: 1 };
const createYapeAccount = (): YapeAccount => ({
  id: crypto.randomUUID(), provider: 'YAPE', label: '', phone: '', holder: '', code: '', qrImageUrl: '', enabled: true,
});

export default function BusinessSettingsPage() {
  const { token, organizationId } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [name, setName] = useState('');
  const [modules, setModules] = useState<string[]>([]);
  const [currency, setCurrency] = useState('PEN');
  const [timezone, setTimezone] = useState('America/Lima');
  const [fiscalRuc, setFiscalRuc] = useState('');
  const [fiscalName, setFiscalName] = useState('');
  const [fiscalAddress, setFiscalAddress] = useState('');
  const [series, setSeries] = useState(defaultSeries);
  const [yapeAccounts, setYapeAccounts] = useState<YapeAccount[]>([]);
  const [nubefact, setNubefact] = useState<NubefactStatus | null>(null);
  const [nubefactEndpoint, setNubefactEndpoint] = useState('');
  const [nubefactToken, setNubefactToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token || !organizationId) return;
    void Promise.all([
      apiFetch<Organization>(`/organizations/${organizationId}`, { token, organizationId }),
      apiFetch<NubefactStatus>('/billing/nubefact/settings', { token, organizationId }),
    ]).then(([result, providerStatus]) => {
      setOrganization(result);
      setName(result.name);
      const settings = result.settings ?? {};
      const enabled = Array.isArray(result.enabledModules) && result.enabledModules.length
        ? result.enabledModules : result.businessType.defaultModules;
      setModules(Array.isArray(enabled) ? enabled.filter((item): item is string => typeof item === 'string') : []);
      setCurrency(typeof settings.currency === 'string' ? settings.currency : 'PEN');
      setTimezone(typeof settings.timezone === 'string' ? settings.timezone : 'America/Lima');
      const billing = settings.billing && typeof settings.billing === 'object' ? settings.billing as Record<string, unknown> : {};
      const fiscal = billing.fiscal && typeof billing.fiscal === 'object' ? billing.fiscal as Record<string, unknown> : {};
      const configuredSeries = billing.series && typeof billing.series === 'object' ? billing.series as Record<string, unknown> : {};
      setFiscalRuc(typeof fiscal.ruc === 'string' ? fiscal.ruc : '');
      setFiscalName(typeof fiscal.legalName === 'string' ? fiscal.legalName : '');
      setFiscalAddress(typeof fiscal.address === 'string' ? fiscal.address : '');
      setSeries({
        ticket: typeof configuredSeries.ticket === 'string' ? configuredSeries.ticket : defaultSeries.ticket,
        ticketNextNumber: typeof configuredSeries.ticketNextNumber === 'number' ? configuredSeries.ticketNextNumber : defaultSeries.ticketNextNumber,
        boleta: typeof configuredSeries.boleta === 'string' ? configuredSeries.boleta : defaultSeries.boleta,
        boletaNextNumber: typeof configuredSeries.boletaNextNumber === 'number' ? configuredSeries.boletaNextNumber : defaultSeries.boletaNextNumber,
        factura: typeof configuredSeries.factura === 'string' ? configuredSeries.factura : defaultSeries.factura,
        facturaNextNumber: typeof configuredSeries.facturaNextNumber === 'number' ? configuredSeries.facturaNextNumber : defaultSeries.facturaNextNumber,
      });
      setYapeAccounts(Array.isArray(billing.yapeAccounts) ? billing.yapeAccounts as YapeAccount[] : []);
      setNubefact(providerStatus);
      setNubefactEndpoint(providerStatus.endpointUrl ?? 'https://api.nubefact.com/api/v1/');
    }).catch((caughtError: unknown) => {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo cargar la configuración');
    });
  }, [organizationId, token]);

  function toggleModule(module: string) {
    setModules((current) => current.includes(module) ? current.filter((item) => item !== module) : [...current, module]);
  }

  function updateYapeAccount(id: string, changes: Partial<YapeAccount>) {
    setYapeAccounts((current) => current.map((account) => account.id === id ? { ...account, ...changes } : account));
  }

  async function saveBusinessSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !organizationId || !organization) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const updated = await apiFetch<Organization>(`/organizations/${organizationId}`, {
        method: 'PATCH', token, organizationId,
        body: JSON.stringify({
          name,
          enabledModules: modules,
          settings: {
            ...organization.settings,
            currency,
            timezone,
            billing: {
              fiscal: { ruc: fiscalRuc, legalName: fiscalName, address: fiscalAddress },
              series,
              yapeAccounts,
            },
          },
        }),
      });
      setOrganization(updated);
      setMessage('Configuración del negocio guardada.');
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo guardar la configuración');
    } finally { setSaving(false); }
  }

  async function saveNubefact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !organizationId) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const status = await apiFetch<NubefactStatus>('/billing/nubefact/settings', {
        method: 'PUT', token, organizationId,
        body: JSON.stringify({ endpointUrl: nubefactEndpoint, ...(nubefactToken ? { token: nubefactToken } : {}) }),
      });
      setNubefact(status);
      setNubefactToken('');
      setMessage('Conexión Nubefact guardada. El token se cifra y no vuelve a mostrarse.');
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo guardar Nubefact');
    } finally { setSaving(false); }
  }

  return (
    <OwnerShell active="settings">
      <OwnerHeader eyebrow="Administración" title="Configuración del negocio" />
      {error && <p className="error-message" role="alert">{error}</p>}
      {message && <p className="success-message" role="status">{message}</p>}
      {organization && <div className="billing-settings-layout">
        <form className="panel compact-form business-settings-form" onSubmit={saveBusinessSettings}>
          <div><span className="eyebrow">Identidad del negocio</span><h2>{organization.businessType.name}</h2></div>
          <label>Nombre comercial<input required value={name} onChange={(event) => setName(event.target.value)} /></label>
          <div className="settings-grid">
            <label>Moneda<select value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="PEN">PEN · Sol peruano</option><option value="MXN">MXN · Peso mexicano</option><option value="USD">USD · Dólar estadounidense</option><option value="COP">COP · Peso colombiano</option><option value="CLP">CLP · Peso chileno</option></select></label>
            <label>Zona horaria<select value={timezone} onChange={(event) => setTimezone(event.target.value)}><option value="America/Lima">America/Lima</option><option value="America/Mexico_City">America/Mexico_City</option><option value="America/Bogota">America/Bogota</option><option value="America/Santiago">America/Santiago</option><option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos_Aires</option><option value="UTC">UTC</option></select></label>
          </div>

          <fieldset className="settings-modules"><legend>Módulos habilitados</legend><div className="module-list">{availableModules.map((module) => <label className="module-option" key={module}><input type="checkbox" checked={modules.includes(module)} onChange={() => toggleModule(module)} />{module.charAt(0).toUpperCase() + module.slice(1)}</label>)}</div></fieldset>

          <section className="billing-settings-section">
            <div className="panel-heading"><div><span className="eyebrow">Comprobantes electrónicos</span><h2>Datos fiscales y series</h2></div></div>
            <div className="settings-grid">
              <label>RUC del emisor<input inputMode="numeric" maxLength={11} value={fiscalRuc} onChange={(event) => setFiscalRuc(event.target.value.replace(/\D/g, ''))} placeholder="11 dígitos" /></label>
              <label>Razón social<input value={fiscalName} onChange={(event) => setFiscalName(event.target.value)} /></label>
            </div>
            <label>Domicilio fiscal<input value={fiscalAddress} onChange={(event) => setFiscalAddress(event.target.value)} /></label>
            <div className="settings-grid">
              <label>Serie ticket<input required maxLength={4} pattern="[A-Za-z0-9]{1,4}" value={series.ticket} onChange={(event) => setSeries({ ...series, ticket: event.target.value.toUpperCase() })} /></label>
              <label>Próximo ticket<input required min="1" step="1" type="number" value={series.ticketNextNumber} onChange={(event) => setSeries({ ...series, ticketNextNumber: Number(event.target.value) })} /></label>
              <label>Serie boleta<input required maxLength={4} pattern="[A-Za-z0-9]{1,4}" value={series.boleta} onChange={(event) => setSeries({ ...series, boleta: event.target.value.toUpperCase() })} /></label>
              <label>Próxima boleta<input required min="1" step="1" type="number" value={series.boletaNextNumber} onChange={(event) => setSeries({ ...series, boletaNextNumber: Number(event.target.value) })} /></label>
              <label>Serie factura<input required maxLength={4} pattern="[A-Za-z0-9]{1,4}" value={series.factura} onChange={(event) => setSeries({ ...series, factura: event.target.value.toUpperCase() })} /></label>
              <label>Próxima factura<input required min="1" step="1" type="number" value={series.facturaNextNumber} onChange={(event) => setSeries({ ...series, facturaNextNumber: Number(event.target.value) })} /></label>
            </div>
            <p className="muted">El correlativo avanza automáticamente desde el número indicado y nunca retrocede respecto a los comprobantes guardados. Los tickets son internos; boletas y facturas se envían a SUNAT mediante Nubefact.</p>
          </section>

          <section className="billing-settings-section">
            <div className="panel-heading"><div><span className="eyebrow">Pagos digitales</span><h2>Cuentas Yape / Plin</h2></div><button type="button" className="btn-quiet" onClick={() => setYapeAccounts([...yapeAccounts, createYapeAccount()])}>＋ Agregar cuenta</button></div>
            {yapeAccounts.map((account, index) => <fieldset className="yape-account-form" key={account.id}>
              <legend>Cuenta digital {index + 1}</legend>
              <div className="settings-grid">
                <label>Billetera<select value={account.provider} onChange={(event) => updateYapeAccount(account.id, { provider: event.target.value as YapeAccount['provider'] })}><option value="YAPE">Yape</option><option value="PLIN">Plin</option></select></label>
                <label>Etiqueta<input required value={account.label} onChange={(event) => updateYapeAccount(account.id, { label: event.target.value })} placeholder="Caja principal" /></label>
                <label>Número de celular<input required inputMode="tel" value={account.phone} onChange={(event) => updateYapeAccount(account.id, { phone: event.target.value })} placeholder="999 999 999" /></label>
                <label>Titular<input value={account.holder} onChange={(event) => updateYapeAccount(account.id, { holder: event.target.value })} /></label>
                <label>Código o referencia<input value={account.code} onChange={(event) => updateYapeAccount(account.id, { code: event.target.value })} /></label>
                <label>URL de imagen QR<input type="url" value={account.qrImageUrl} onChange={(event) => updateYapeAccount(account.id, { qrImageUrl: event.target.value })} placeholder="https://..." /></label>
              </div>
              <div className="yape-account-actions"><label className="module-option"><input type="checkbox" checked={account.enabled} onChange={(event) => updateYapeAccount(account.id, { enabled: event.target.checked })} />Disponible al cobrar</label><button type="button" className="btn-quiet danger-action" onClick={() => setYapeAccounts(yapeAccounts.filter((item) => item.id !== account.id))}>Eliminar cuenta</button></div>
              {account.qrImageUrl && <img className="configured-yape-qr" src={account.qrImageUrl} alt={`QR de ${account.label || account.provider}`} />}
            </fieldset>)}
            {!yapeAccounts.length && <p className="muted">Aún no hay cuentas Yape o Plin. Agrega un número para mostrarlo al cobrar.</p>}
          </section>
          <button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar configuración del negocio'}</button>
        </form>

        <form className="panel compact-form nubefact-settings" onSubmit={saveNubefact}>
          <div className="panel-heading"><div><span className="eyebrow">Integración SUNAT</span><h2>Nubefact</h2></div><span className={`sale-status ${nubefact?.configured ? 'sale-status-completada' : 'sale-status-borrador'}`}>{nubefact?.configured ? 'Configurado' : 'Pendiente'}</span></div>
          <p className="muted">La ruta y el token son por organización. El token se cifra en el servidor y solo se muestra su estado.</p>
          <label>Ruta API de Nubefact<input required type="url" value={nubefactEndpoint} onChange={(event) => setNubefactEndpoint(event.target.value)} placeholder="https://api.nubefact.com/api/v1/..." /></label>
          <label>Token de API{nubefact?.tokenConfigured && <small className="muted">Ya hay un token guardado. Déjalo vacío para conservarlo.</small>}<input type="password" autoComplete="new-password" minLength={16} required={!nubefact?.tokenConfigured} value={nubefactToken} onChange={(event) => setNubefactToken(event.target.value)} placeholder={nubefact?.tokenConfigured ? 'Token guardado (oculto)' : 'Pega aquí el token del ambiente demo o producción'} /></label>
          {!nubefact?.encryptionKeyConfigured && <p className="error-message">Falta configurar NUBEFACT_ENCRYPTION_KEY en el entorno backend antes de guardar credenciales.</p>}
          {nubefact?.configured && <p className="muted">Conectado a {nubefact.endpointHost}. Token: {nubefact.tokenConfigured ? 'guardado' : 'no configurado'}.</p>}
          <button type="submit" disabled={saving || !nubefact?.encryptionKeyConfigured}>{saving ? 'Guardando...' : 'Guardar conexión Nubefact'}</button>
        </form>
      </div>}
    </OwnerShell>
  );
}