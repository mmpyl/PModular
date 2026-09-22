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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Organization = { id: string; name: string; enabledModules: unknown; settings: Record<string, unknown>; businessType: { id: string; name: string; code: string; defaultModules: unknown } };
const availableModules = ['inventario', 'ventas', 'compras', 'caja'];
const currencies = [
  { code: 'PEN', name: 'Sol Peruano' },
  { code: 'USD', name: 'Dólar Estadounidense' },
  { code: 'EUR', name: 'Euro' },
  { code: 'MXN', name: 'Peso Mexicano' },
  { code: 'COP', name: 'Peso Colombiano' },
  { code: 'CLP', name: 'Peso Chileno' },
  { code: 'ARS', name: 'Peso Argentino' },
  { code: 'BRL', name: 'Real Brasileño' },
];
const timezones = [
  { value: 'America/Lima', label: 'Perú (PET)' },
  { value: 'America/Bogota', label: 'Colombia (COT)' },
  { value: 'America/Mexico_City', label: 'México (CST)' },
  { value: 'America/Santiago', label: 'Chile (CLT)' },
  { value: 'America/Buenos_Aires', label: 'Argentina (ART)' },
  { value: 'America/Sao_Paulo', label: 'Brasil (BRT)' },
  { value: 'America/Guatemala', label: 'Guatemala (CST)' },
  { value: 'America/Panama', label: 'Panamá (EST)' },
  { value: 'UTC', label: 'UTC' },
];
const taxRates = [
  { value: 0.18, label: '18% (IGV - Perú)' },
  { value: 0.19, label: '19% (IVA - Colombia)' },
  { value: 0.16, label: '16% (IVA - México)' },
  { value: 0.21, label: '21% (IVA - España)' },
  { value: 0.1, label: '10%' },
  { value: 0.05, label: '5%' },
  { value: 0, label: '0% (Sin impuesto)' },
];

export default function BusinessSettingsPage() {
  const { token, organizationId } = useAuth(); const [organization, setOrganization] = useState<Organization | null>(null); const [name, setName] = useState(''); const [modules, setModules] = useState<string[]>([]); const [currency, setCurrency] = useState('PEN'); const [timezone, setTimezone] = useState('America/Lima'); const [defaultTaxRate, setDefaultTaxRate] = useState(0.18); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  useEffect(() => { if (!token || !organizationId) return; void apiFetch<Organization>(`/organizations/${organizationId}`, { token, organizationId }).then((result) => { setOrganization(result); setName(result.name); setModules(Array.isArray(result.enabledModules) && result.enabledModules.length ? result.enabledModules.filter((item): item is string => typeof item === 'string') : []); const settings = result.settings || {}; setCurrency((settings.currency as string) || 'PEN'); setTimezone((settings.timezone as string) || 'America/Lima'); setDefaultTaxRate((settings.defaultTaxRate as number) ?? 0.18); }).catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'No se pudo cargar la configuración')); }, [organizationId, token]);
  function toggleModule(module: string) { setModules((current) => current.includes(module) ? current.filter((item) => item !== module) : [...current, module]); }
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!token || !organizationId) return; try { const updated = await apiFetch<Organization>(`/organizations/${organizationId}`, { method: 'PATCH', token, organizationId, body: JSON.stringify({ name, enabledModules: modules, settings: { currency, timezone, defaultTaxRate } }) }); setOrganization(updated); setMessage('Configuración guardada'); setError(''); } catch (e: unknown) { setError(e instanceof ApiError ? e.message : 'No se pudo guardar la configuración'); } }
  return <OwnerShell active="settings"><OwnerHeader eyebrow="Administración" title="Configuración del negocio" />{error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}{message && <Alert className="bg-green-50 border-green-200"><AlertDescription className="text-green-800">{message}</AlertDescription></Alert>}{organization && <Card className="mt-4"><CardHeader><div className="space-y-1"><p className="text-sm font-medium text-muted-foreground">Identidad</p><h2 className="text-2xl font-semibold leading-none tracking-tight">{organization.businessType.name}</h2></div></CardHeader><CardContent><form onSubmit={save} className="space-y-6"><div className="space-y-2"><Label htmlFor="business-name">Nombre comercial</Label><Input id="business-name" required value={name} onChange={(e) => setName(e.target.value)} /></div><div className="space-y-4"><div className="space-y-2"><p className="text-sm font-medium">Módulos habilitados</p><div className="grid gap-3">{availableModules.map((module) => (<div key={module} className="flex items-center space-x-2"><Checkbox id={module} checked={modules.includes(module)} onCheckedChange={() => toggleModule(module)} /><Label htmlFor={module} className="font-normal">{module}</Label></div>))}</div></div></div><div className="space-y-4 border-t pt-6"><div className="space-y-2"><Label htmlFor="currency">Moneda</Label><Select value={currency} onValueChange={setCurrency}><SelectTrigger id="currency"><SelectValue placeholder="Selecciona una moneda" /></SelectTrigger><SelectContent>{currencies.map((curr) => (<SelectItem key={curr.code} value={curr.code}>{curr.name} ({curr.code})</SelectItem>))}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="timezone">Zona horaria</Label><Select value={timezone} onValueChange={setTimezone}><SelectTrigger id="timezone"><SelectValue placeholder="Selecciona una zona horaria" /></SelectTrigger><SelectContent>{timezones.map((tz) => (<SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>))}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="taxRate">Impuesto por defecto</Label><Select value={String(defaultTaxRate)} onValueChange={(value) => setDefaultTaxRate(Number(value))}><SelectTrigger id="taxRate"><SelectValue placeholder="Selecciona un impuesto" /></SelectTrigger><SelectContent>{taxRates.map((rate) => (<SelectItem key={rate.value} value={String(rate.value)}>{rate.label}</SelectItem>))}</SelectContent></Select></div></div><Button type="submit">Guardar configuración</Button></form></CardContent></Card>}</OwnerShell>;
}