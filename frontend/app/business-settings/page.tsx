'use client';

import { FormEvent, useEffect, useState } from 'react';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';

type Organization = { id: string; name: string; enabledModules: unknown; settings: Record<string, unknown>; businessType: { id: string; name: string; code: string; defaultModules: unknown } };
const availableModules = ['inventario', 'ventas', 'compras', 'caja'];

export default function BusinessSettingsPage() {
  const { token, organizationId } = useAuth(); const [organization, setOrganization] = useState<Organization | null>(null); const [name, setName] = useState(''); const [modules, setModules] = useState<string[]>([]); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  useEffect(() => { if (!token || !organizationId) return; void apiFetch<Organization>(`/organizations/${organizationId}`, { token, organizationId }).then((result) => { setOrganization(result); setName(result.name); setModules(Array.isArray(result.enabledModules) && result.enabledModules.length ? result.enabledModules.filter((item): item is string => typeof item === 'string') : []); }).catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'No se pudo cargar la configuración')); }, [organizationId, token]);
  function toggleModule(module: string) { setModules((current) => current.includes(module) ? current.filter((item) => item !== module) : [...current, module]); }
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!token || !organizationId) return; try { const updated = await apiFetch<Organization>(`/organizations/${organizationId}`, { method: 'PATCH', token, organizationId, body: JSON.stringify({ name, enabledModules: modules }) }); setOrganization(updated); setMessage('Configuración guardada'); setError(''); } catch (e: unknown) { setError(e instanceof ApiError ? e.message : 'No se pudo guardar la configuración'); } }
  return <OwnerShell active="settings"><OwnerHeader eyebrow="Administración" title="Configuración del negocio" />{error && <p className="error-message">{error}</p>}{organization && <form className="panel compact-form" onSubmit={save}><span className="eyebrow">Identidad</span><h2>{organization.businessType.name}</h2><label>Nombre comercial<input required value={name} onChange={(e) => setName(e.target.value)} /></label><div><span className="eyebrow">Módulos habilitados</span><div className="module-list">{availableModules.map((module) => <label className="module-option" key={module}><input type="checkbox" checked={modules.includes(module)} onChange={() => toggleModule(module)} />{module}</label>)}</div></div>{message && <p className="success-message">{message}</p>}<button type="submit">Guardar configuración</button></form>}</OwnerShell>;
}