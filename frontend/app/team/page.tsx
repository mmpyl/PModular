'use client';

import { useEffect, useState } from 'react';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';

type Member = { id: string; role: string; user: { id: string; name: string | null; email: string } };

export default function TeamPage() {
  const { token, organizationId, orgRole } = useAuth();
  const [members, setMembers] = useState<Member[]>([]); const [error, setError] = useState('');
  useEffect(() => { if (!token || !organizationId) return; void apiFetch<Member[] | Member>(`/memberships/organization/${organizationId}`, { token, organizationId }).then((result) => setMembers(Array.isArray(result) ? result : [result])).catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'No se pudo cargar el equipo')); }, [organizationId, token]);
  return <OwnerShell active="team"><OwnerHeader eyebrow="Equipo" title={orgRole === 'OWNER' ? 'Equipo y permisos' : 'Equipo'} />{orgRole === 'OWNER' ? <p className="success-message">Como propietario puedes administrar los accesos de esta organización.</p> : <p className="muted">Consulta los miembros y sus roles. Solo el propietario puede modificar permisos.</p>}{error && <p className="error-message">{error}</p>}<section className="panel"><div className="panel-heading"><div><span className="eyebrow">Miembros</span><h2>Usuarios de la organización</h2></div><span className="role-badge">{members.length} miembros</span></div>{members.map((member) => <div className="list-row" key={member.id}><span><strong>{member.user.name || member.user.email}</strong><small>{member.user.email}</small></span><span className="role-badge">{member.role}</span></div>)}{!members.length && !error && <p className="muted">No hay miembros para mostrar.</p>}</section></OwnerShell>;
}