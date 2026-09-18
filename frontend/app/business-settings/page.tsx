'use client';

import { FormEvent, useEffect, useState } from 'react';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Organization = { id: string; name: string; enabledModules: unknown; settings: Record<string, unknown>; businessType: { id: string; name: string; code: string; defaultModules: unknown } };
const availableModules = ['inventario', 'ventas', 'compras', 'caja'];

export default function BusinessSettingsPage() {
  const { token, organizationId } = useAuth(); const [organization, setOrganization] = useState<Organization | null>(null); const [name, setName] = useState(''); const [modules, setModules] = useState<string[]>([]); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  useEffect(() => { if (!token || !organizationId) return; void apiFetch<Organization>(`/organizations/${organizationId}`, { token, organizationId }).then((result) => { setOrganization(result); setName(result.name); setModules(Array.isArray(result.enabledModules) && result.enabledModules.length ? result.enabledModules.filter((item): item is string => typeof item === 'string') : []); }).catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'No se pudo cargar la configuración')); }, [organizationId, token]);
  function toggleModule(module: string) { setModules((current) => current.includes(module) ? current.filter((item) => item !== module) : [...current, module]); }
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!token || !organizationId) return; try { const updated = await apiFetch<Organization>(`/organizations/${organizationId}`, { method: 'PATCH', token, organizationId, body: JSON.stringify({ name, enabledModules: modules }) }); setOrganization(updated); setMessage('Configuración guardada'); setError(''); } catch (e: unknown) { setError(e instanceof ApiError ? e.message : 'No se pudo guardar la configuración'); } }
  return <OwnerShell active="settings"><OwnerHeader eyebrow="Administración" title="Configuración del negocio" />{error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}{message && <Alert className="bg-green-50 border-green-200"><AlertDescription className="text-green-800">{message}</AlertDescription></Alert>}{organization && <Card className="mt-4"><CardHeader><div className="space-y-1"><p className="text-sm font-medium text-muted-foreground">Identidad</p><h2 className="text-2xl font-semibold leading-none tracking-tight">{organization.businessType.name}</h2></div></CardHeader><CardContent><form onSubmit={save} className="space-y-6"><div className="space-y-2"><Label htmlFor="business-name">Nombre comercial</Label><Input id="business-name" required value={name} onChange={(e) => setName(e.target.value)} /></div><div className="space-y-4"><div className="space-y-2"><p className="text-sm font-medium">Módulos habilitados</p><div className="grid gap-3">{availableModules.map((module) => (<div key={module} className="flex items-center space-x-2"><Checkbox id={module} checked={modules.includes(module)} onCheckedChange={() => toggleModule(module)} /><Label htmlFor={module} className="font-normal">{module}</Label></div>))}</div></div></div><Button type="submit">Guardar configuración</Button></form></CardContent></Card>}</OwnerShell>;
}