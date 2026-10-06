'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError, apiFetch } from '@/lib/api';

type OrgRole = 'OWNER' | 'ADMIN' | 'VENDEDOR' | 'INVENTARIO' | 'CAJA';
type Member = { id: string; organizationId: string; role: OrgRole; user: { id: string; name: string | null; email: string } };
const ROLES: OrgRole[] = ['OWNER', 'ADMIN', 'VENDEDOR', 'INVENTARIO', 'CAJA'];
const ROLE_LABELS: Record<OrgRole, string> = { OWNER: 'Propietario', ADMIN: 'Administrador', VENDEDOR: 'Vendedor', INVENTARIO: 'Inventario', CAJA: 'Caja' };

export default function TeamPage() {
  const { token, organizationId, orgRole } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<OrgRole>('VENDEDOR');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token || !organizationId) return;
    try {
      const result = await apiFetch<Member[] | Member>(`/memberships/organization/${organizationId}`, { token, organizationId });
      setMembers(Array.isArray(result) ? result : [result]);
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo cargar el equipo');
    }
  }, [token, organizationId]);

  useEffect(() => { void load(); }, [load]);

  const visibleMembers = useMemo(() => members.filter((member) =>
    `${member.user.name ?? ''} ${member.user.email} ${ROLE_LABELS[member.role]}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  ), [members, search]);
  const ownerCount = members.filter((member) => member.role === 'OWNER').length;

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !organizationId) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await apiFetch('/memberships/team', {
        method: 'POST', token, organizationId,
        body: JSON.stringify({ email, name: name || undefined, password: password || undefined, role }),
      });
      setEmail(''); setName(''); setPassword(''); setRole('VENDEDOR');
      setNotice('Miembro agregado al negocio.');
      await load();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo agregar al miembro');
    } finally { setBusy(false); }
  }

  async function changeRole(member: Member, nextRole: OrgRole) {
    if (!token || !organizationId || member.role === nextRole) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await apiFetch(`/memberships/${member.user.id}/${organizationId}/role`, {
        method: 'PATCH', token, organizationId, body: JSON.stringify({ role: nextRole }),
      });
      setNotice(`Rol de ${member.user.name || member.user.email} actualizado.`);
      await load();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo cambiar el rol');
    } finally { setBusy(false); }
  }

  async function removeMember(member: Member) {
    if (!token || !organizationId || !window.confirm(`¿Retirar el acceso de ${member.user.email} a este negocio? La cuenta de usuario no se elimina.`)) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await apiFetch(`/memberships/${member.user.id}/${organizationId}`, { method: 'DELETE', token, organizationId });
      setNotice('Acceso retirado. La cuenta conserva sus otros negocios.');
      await load();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo retirar el acceso');
    } finally { setBusy(false); }
  }

  const isOwner = orgRole === 'OWNER';

  return (
    <OwnerShell active="team">
      <OwnerHeader eyebrow="Equipo" title={isOwner ? 'Equipo y permisos' : 'Equipo'} />
      {error && <p className="error-message" role="alert">{error}</p>}
      {notice && <p className="success-message" role="status">{notice}</p>}

      <section className="metric-grid team-metrics">
        <article className="metric-card"><span>Miembros</span><strong>{members.length}</strong><small>Accesos a este negocio</small></article>
        <article className="metric-card"><span>Propietarios</span><strong>{ownerCount}</strong><small>Siempre debe permanecer al menos uno</small></article>
        <article className="metric-card"><span>Administradores</span><strong>{members.filter((member) => member.role === 'ADMIN').length}</strong><small>Gestión del negocio</small></article>
      </section>

      <div className="team-layout">
        {isOwner && <section className="panel team-editor">
          <div className="panel-heading"><div><span className="eyebrow">Acceso</span><h2>Agregar miembro</h2></div></div>
          <form className="compact-form" onSubmit={addMember}>
            <label>Correo<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="persona@negocio.com" /></label>
            <label>Nombre (si es cuenta nueva)<input value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label>Contraseña inicial (si es cuenta nueva)<input minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            <label>Rol inicial<select value={role} onChange={(event) => setRole(event.target.value as OrgRole)}>{ROLES.map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}</select></label>
            <p className="muted">Si el correo ya tiene una cuenta, se agregará al negocio sin cambiar su contraseña. Si no existe, crea una contraseña inicial.</p>
            <button type="submit" disabled={busy}>{busy ? 'Agregando...' : 'Agregar al equipo'}</button>
          </form>
        </section>}

        <section className="panel team-directory">
          <div className="panel-heading"><div><span className="eyebrow">Accesos del negocio</span><h2>Miembros</h2></div><span className="role-badge">{members.length} miembros</span></div>
          <div className="catalog-search-row"><input aria-label="Buscar equipo" placeholder="Buscar nombre, correo o rol..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          {visibleMembers.map((member) => <div className="list-row team-row" key={member.id}>
            <span><strong>{member.user.name || member.user.email}</strong><small>{member.user.email}</small></span>
            {isOwner ? <select aria-label={`Rol de ${member.user.email}`} value={member.role} disabled={busy} onChange={(event) => void changeRole(member, event.target.value as OrgRole)}>
              {ROLES.map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}
            </select> : <span className="role-badge">{ROLE_LABELS[member.role]}</span>}
            {isOwner && <button type="button" className="btn-quiet danger-action" disabled={busy} onClick={() => void removeMember(member)}>Retirar</button>}
          </div>)}
          {!visibleMembers.length && <p className="muted">{members.length ? 'No hay miembros que coincidan con la búsqueda.' : 'Todavía no hay miembros en este negocio.'}</p>}
        </section>
      </div>
    </OwnerShell>
  );
}