'use client';

import { FormEvent, useEffect, useState } from 'react';
import { PlatformRoute } from '@/components/PlatformRoute';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError, apiFetch } from '@/lib/api';

type BusinessType = {
  id: string;
  name: string;
  defaultModules: unknown;
};

type PlatformOrganization = {
  id: string;
  name: string;
  businessTypeId: string;
  enabledModules: string[];
  businessType: BusinessType;
  memberships: { role: string; user: { id: string; name: string | null; email: string } }[];
};

type OrganizationDraft = {
  id: string;
  name: string;
  businessTypeId: string;
  enabledModules: string[];
  ownerEmail: string;
};

const moduleNames = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const moduleLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export default function PlatformPage() {
  const { token, user, logout } = useAuth();
  const [organizations, setOrganizations] = useState<PlatformOrganization[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [draft, setDraft] = useState<OrganizationDraft | null>(null);
  const [newName, setNewName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newBusinessTypeId, setNewBusinessTypeId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([
      apiFetch<PlatformOrganization[]>('/organizations/platform/all', { token }),
      apiFetch<BusinessType[]>('/business-types', { token }),
    ])
      .then(([items, types]) => {
        if (!active) return;
        setOrganizations(items);
        setBusinessTypes(types);
        setNewBusinessTypeId(types[0]?.id ?? '');
      })
      .catch((caughtError: unknown) => {
        if (active) setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudieron cargar los negocios');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token]);

  async function refreshOrganizations() {
    if (!token) return;
    const items = await apiFetch<PlatformOrganization[]>('/organizations/platform/all', { token });
    setOrganizations(items);
  }

  function beginEdit(organization: PlatformOrganization) {
    const modules = moduleNames(organization.enabledModules);
    setDraft({
      id: organization.id,
      name: organization.name,
      businessTypeId: organization.businessTypeId,
      enabledModules: modules.length ? modules : moduleNames(organization.businessType.defaultModules),
      ownerEmail: '',
    });
    setError('');
    setNotice('');
  }

  async function createOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await apiFetch('/organizations/platform', {
        method: 'POST',
        token,
        body: JSON.stringify({ name: newName, businessTypeId: newBusinessTypeId, ownerEmail: newOwnerEmail }),
      });
      await refreshOrganizations();
      setNewName('');
      setNewOwnerEmail('');
      setNotice('Negocio creado y asignado a su owner.');
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo crear el negocio');
    } finally {
      setBusy(false);
    }
  }

  async function updateOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !draft) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await apiFetch(`/organizations/platform/${draft.id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          name: draft.name,
          businessTypeId: draft.businessTypeId,
          enabledModules: draft.enabledModules,
          ownerEmail: draft.ownerEmail.trim() || undefined,
        }),
      });
      await refreshOrganizations();
      setDraft(null);
      setNotice(draft.ownerEmail.trim() ? 'Cambios guardados y owner asignado.' : 'Cambios guardados.');
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudieron guardar los cambios');
    } finally {
      setBusy(false);
    }
  }

  const draftBusinessType = businessTypes.find((type) => type.id === draft?.businessTypeId);
  const editableModules = draft
    ? [...new Set([...moduleNames(draftBusinessType?.defaultModules), ...draft.enabledModules])]
    : [];

  return (
    <PlatformRoute>
      <div className="app-shell">
        <aside className="sidebar platform-sidebar">
          <div><strong>PModular</strong><span>Administración de plataforma</span></div>
          <nav><a className="active" href="/platform">Negocios</a></nav>
          <button type="button" className="quiet-button" onClick={logout}>Cerrar sesión</button>
        </aside>
        <main className="workspace platform-workspace">
          <header className="topbar">
            <div>
              <span className="eyebrow">Plataforma · {user?.email}</span>
              <h1>Negocios</h1>
              <p className="muted">Administración global de organizaciones multi-tenant.</p>
            </div>
            <span className="role-badge">{organizations.length} organizaciones</span>
          </header>

          {error && <p className="error-message" role="alert">{error}</p>}
          {notice && <p className="success-message" role="status">{notice}</p>}

          <section className="panel">
            <div className="panel-heading">
              <div><span className="eyebrow">Directorio</span><h2>Organizaciones</h2></div>
            </div>
            {loading ? <p className="loading-message">Cargando organizaciones...</p> : organizations.length === 0 ? (
              <p className="muted">Todavía no hay negocios registrados.</p>
            ) : (
              <div className="platform-table-wrap">
                <table className="platform-table">
                  <thead><tr><th>Negocio</th><th>Tipo</th><th>Owner</th><th>Módulos</th><th /></tr></thead>
                  <tbody>
                    {organizations.map((organization) => {
                      const owners = organization.memberships.map((membership) => membership.user);
                      const modules = moduleNames(organization.enabledModules);
                      return (
                        <tr key={organization.id}>
                          <td><strong>{organization.name}</strong><small>{organization.id}</small></td>
                          <td>{organization.businessType.name}</td>
                          <td>{owners.length ? owners.map((owner) => owner.email).join(', ') : 'Sin owner'}</td>
                          <td>{(modules.length ? modules : moduleNames(organization.businessType.defaultModules)).map(moduleLabel).join(', ')}</td>
                          <td><button type="button" className="btn-quiet" onClick={() => beginEdit(organization)}>Editar</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="platform-management-grid">
            <section className="panel">
              <div className="panel-heading">
                <div><span className="eyebrow">Alta</span><h2>Crear negocio</h2></div>
              </div>
              <form className="compact-form" onSubmit={createOrganization}>
                <label>Nombre comercial<input required value={newName} onChange={(event) => setNewName(event.target.value)} /></label>
                <label>Tipo de negocio
                  <select required value={newBusinessTypeId} onChange={(event) => setNewBusinessTypeId(event.target.value)}>
                    {businessTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                  </select>
                </label>
                <label>Email de la cuenta owner
                  <input required type="email" value={newOwnerEmail} onChange={(event) => setNewOwnerEmail(event.target.value)} />
                </label>
                <p className="muted">La cuenta debe estar registrada como usuario de negocio. Las cuentas de plataforma no pueden ser owners.</p>
                <button type="submit" disabled={busy || !businessTypes.length}>{busy ? 'Creando...' : 'Crear negocio'}</button>
              </form>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div><span className="eyebrow">Configuración</span><h2>{draft ? 'Editar negocio' : 'Selecciona un negocio'}</h2></div>
              </div>
              {draft ? (
                <form className="compact-form" onSubmit={updateOrganization}>
                  <label>Nombre comercial<input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
                  <label>Tipo de negocio
                    <select value={draft.businessTypeId} onChange={(event) => {
                      const type = businessTypes.find((item) => item.id === event.target.value);
                      setDraft({ ...draft, businessTypeId: event.target.value, enabledModules: moduleNames(type?.defaultModules) });
                    }}>
                      {businessTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                    </select>
                  </label>
                  <label>Agregar o ascender cuenta owner
                    <input
                      type="email"
                      value={draft.ownerEmail}
                      onChange={(event) => setDraft({ ...draft, ownerEmail: event.target.value })}
                      placeholder="owner@negocio.com"
                    />
                  </label>
                  <p className="muted">La cuenta debe estar registrada y no puede ser una cuenta de plataforma.</p>
                  <fieldset className="platform-modules">
                    <legend>Módulos habilitados</legend>
                    {editableModules.map((module) => (
                      <label key={module}>
                        <input
                          type="checkbox"
                          checked={draft.enabledModules.includes(module)}
                          onChange={(event) => setDraft({
                            ...draft,
                            enabledModules: event.target.checked
                              ? [...draft.enabledModules, module]
                              : draft.enabledModules.filter((item) => item !== module),
                          })}
                        />
                        {moduleLabel(module)}
                      </label>
                    ))}
                  </fieldset>
                  <div className="platform-actions">
                    <button type="submit" disabled={busy}>{busy ? 'Guardando...' : 'Guardar cambios'}</button>
                    <button type="button" className="btn-quiet" onClick={() => setDraft(null)}>Cancelar</button>
                  </div>
                </form>
              ) : <p className="muted">Usa “Editar” en el directorio para cambiar la configuración y los módulos.</p>}
            </section>
          </div>
        </main>
      </div>
    </PlatformRoute>
  );
}