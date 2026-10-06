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

type UserMembership = {
  organizationId: string;
  role: 'OWNER' | 'ADMIN' | 'VENDEDOR' | 'INVENTARIO' | 'CAJA';
  organization: { id: string; name: string };
};

type PlatformUser = {
  id: string;
  email: string;
  name: string | null;
  memberships: UserMembership[];
};

type UserDraft = {
  id: string;
  email: string;
  name: string;
  password: string;
  memberships: { organizationId: string; role: UserMembership['role'] }[];
  newOrganizationId: string;
  newRole: UserMembership['role'];
};

type NewUserDraft = {
  email: string;
  name: string;
  password: string;
  organizationId: string;
  role: UserMembership['role'];
};

const ORG_ROLES: UserMembership['role'][] = ['OWNER', 'ADMIN', 'VENDEDOR', 'INVENTARIO', 'CAJA'];

const moduleNames = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const moduleLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export default function PlatformPage() {
  const { token, user, logout } = useAuth();
  const [organizations, setOrganizations] = useState<PlatformOrganization[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [draft, setDraft] = useState<OrganizationDraft | null>(null);
  const [userDraft, setUserDraft] = useState<UserDraft | null>(null);
  const [newUser, setNewUser] = useState<NewUserDraft>({ email: '', name: '', password: '', organizationId: '', role: 'VENDEDOR' });
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
      apiFetch<PlatformUser[]>('/platform/users', { token }),
    ])
      .then(([items, types, platformUsers]) => {
        if (!active) return;
        setOrganizations(items);
        setBusinessTypes(types);
        setUsers(platformUsers);
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

  async function refreshUsers() {
    if (!token) return;
    setUsers(await apiFetch<PlatformUser[]>('/platform/users', { token }));
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

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const memberships = newUser.organizationId
        ? [{ organizationId: newUser.organizationId, role: newUser.role }]
        : [];
      await apiFetch('/platform/users', {
        method: 'POST',
        token,
        body: JSON.stringify({
          email: newUser.email,
          name: newUser.name,
          password: newUser.password,
          memberships,
        }),
      });
      await refreshUsers();
      setNewUser({ email: '', name: '', password: '', organizationId: '', role: 'VENDEDOR' });
      setNotice('Usuario de negocio creado.');
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo crear el usuario');
    } finally {
      setBusy(false);
    }
  }

  function beginEditUser(platformUser: PlatformUser) {
    setUserDraft({
      id: platformUser.id,
      email: platformUser.email,
      name: platformUser.name ?? '',
      password: '',
      memberships: platformUser.memberships.map(({ organizationId, role }) => ({ organizationId, role })),
      newOrganizationId: '',
      newRole: 'VENDEDOR',
    });
    setError('');
    setNotice('');
  }

  async function updateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !userDraft) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const memberships = userDraft.newOrganizationId
        ? [...userDraft.memberships, { organizationId: userDraft.newOrganizationId, role: userDraft.newRole }]
        : userDraft.memberships;
      await apiFetch(`/platform/users/${userDraft.id}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          email: userDraft.email,
          name: userDraft.name,
          password: userDraft.password || undefined,
          memberships,
        }),
      });
      await refreshUsers();
      setUserDraft(null);
      setNotice('Usuario y membresías actualizados.');
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo actualizar el usuario');
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(platformUser: PlatformUser) {
    if (!token || !window.confirm(`¿Eliminar la cuenta ${platformUser.email}? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await apiFetch(`/platform/users/${platformUser.id}`, { method: 'DELETE', token });
      await refreshUsers();
      if (userDraft?.id === platformUser.id) setUserDraft(null);
      setNotice('Cuenta eliminada.');
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo eliminar el usuario');
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
          <nav>
            <a className="active" href="#organizations">Negocios</a>
            <a href="#users">Usuarios</a>
          </nav>
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

          <section className="panel" id="organizations">
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

          <section className="panel" id="users">
            <div className="panel-heading">
              <div><span className="eyebrow">Cuentas tenant</span><h2>Usuarios de negocio</h2></div>
              <span className="role-badge">{users.length} usuarios</span>
            </div>
            {loading ? <p className="loading-message">Cargando usuarios...</p> : users.length === 0 ? (
              <p className="muted">Todavía no hay usuarios de negocio.</p>
            ) : (
              <div className="platform-table-wrap">
                <table className="platform-table">
                  <thead><tr><th>Usuario</th><th>Negocios y roles</th><th /></tr></thead>
                  <tbody>
                    {users.map((platformUser) => (
                      <tr key={platformUser.id}>
                        <td><strong>{platformUser.name || 'Sin nombre'}</strong><small>{platformUser.email}</small></td>
                        <td>{platformUser.memberships.length
                          ? platformUser.memberships.map((membership) => `${membership.organization.name} · ${membership.role}`).join(', ')
                          : 'Sin negocio asignado'}</td>
                        <td className="platform-actions-cell">
                          <button type="button" className="btn-quiet" onClick={() => beginEditUser(platformUser)}>Editar</button>
                          <button type="button" className="btn-quiet danger-action" disabled={busy} onClick={() => void deleteUser(platformUser)}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="platform-management-grid">
            <section className="panel">
              <div className="panel-heading"><div><span className="eyebrow">Alta</span><h2>Crear usuario</h2></div></div>
              <form className="compact-form" onSubmit={createUser}>
                <label>Nombre<input required value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} /></label>
                <label>Email<input required type="email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} /></label>
                <label>Contraseña inicial<input required minLength={8} type="password" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} /></label>
                <label>Negocio inicial
                  <select value={newUser.organizationId} onChange={(event) => setNewUser({ ...newUser, organizationId: event.target.value })}>
                    <option value="">Sin asignar</option>
                    {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
                  </select>
                </label>
                {newUser.organizationId && (
                  <label>Rol inicial
                    <select value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value as UserMembership['role'] })}>
                      {ORG_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </label>
                )}
                <button type="submit" disabled={busy}>{busy ? 'Creando...' : 'Crear usuario'}</button>
              </form>
            </section>

            <section className="panel">
              <div className="panel-heading"><div><span className="eyebrow">Mantenimiento</span><h2>{userDraft ? 'Editar usuario' : 'Selecciona un usuario'}</h2></div></div>
              {userDraft ? (
                <form className="compact-form" onSubmit={updateUser}>
                  <label>Nombre<input required value={userDraft.name} onChange={(event) => setUserDraft({ ...userDraft, name: event.target.value })} /></label>
                  <label>Email<input required type="email" value={userDraft.email} onChange={(event) => setUserDraft({ ...userDraft, email: event.target.value })} /></label>
                  <label>Nueva contraseña (opcional)<input minLength={8} type="password" value={userDraft.password} onChange={(event) => setUserDraft({ ...userDraft, password: event.target.value })} /></label>
                  <fieldset className="platform-memberships">
                    <legend>Negocios y roles</legend>
                    {userDraft.memberships.map((membership) => (
                      <div className="platform-membership-row" key={membership.organizationId}>
                        <span>{organizations.find((organization) => organization.id === membership.organizationId)?.name ?? 'Negocio'}</span>
                        <select value={membership.role} onChange={(event) => setUserDraft({
                          ...userDraft,
                          memberships: userDraft.memberships.map((item) => item.organizationId === membership.organizationId
                            ? { ...item, role: event.target.value as UserMembership['role'] }
                            : item),
                        })}>
                          {ORG_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                        </select>
                        <button type="button" className="btn-quiet danger-action" aria-label={`Quitar ${membership.organizationId}`} onClick={() => setUserDraft({
                          ...userDraft,
                          memberships: userDraft.memberships.filter((item) => item.organizationId !== membership.organizationId),
                        })}>Quitar</button>
                      </div>
                    ))}
                    <div className="platform-membership-row">
                      <select value={userDraft.newOrganizationId} onChange={(event) => setUserDraft({ ...userDraft, newOrganizationId: event.target.value })}>
                        <option value="">Agregar negocio...</option>
                        {organizations.filter((organization) => !userDraft.memberships.some((membership) => membership.organizationId === organization.id))
                          .map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
                      </select>
                      <select value={userDraft.newRole} onChange={(event) => setUserDraft({ ...userDraft, newRole: event.target.value as UserMembership['role'] })}>
                        {ORG_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                      </select>
                    </div>
                  </fieldset>
                  <div className="platform-actions">
                    <button type="submit" disabled={busy}>{busy ? 'Guardando...' : 'Guardar usuario'}</button>
                    <button type="button" className="btn-quiet" onClick={() => setUserDraft(null)}>Cancelar</button>
                  </div>
                </form>
              ) : <p className="muted">Selecciona “Editar” en un usuario para modificar datos y membresías.</p>}
            </section>
          </div>
        </main>
      </div>
    </PlatformRoute>
  );
}