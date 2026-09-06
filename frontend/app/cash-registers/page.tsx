'use client';

import { FormEvent, useEffect, useState } from 'react';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';

type CashRegister = { id: string; name: string; description?: string; status: string; currentBalance?: number | string };

export default function CashRegistersPage() {
  const { token, organizationId } = useAuth();
  const [registers, setRegisters] = useState<CashRegister[]>([]); const [name, setName] = useState(''); const [error, setError] = useState('');
  const load = async () => { if (!token || !organizationId) return; try { setRegisters(await apiFetch<CashRegister[]>('/cash-registers', { token, organizationId })); } catch (e: unknown) { setError(e instanceof ApiError ? e.message : 'No se pudieron cargar las cajas'); } };
  useEffect(() => { void load(); }, [organizationId, token]);
  async function createRegister(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!token || !organizationId) return; try { await apiFetch('/cash-registers', { method: 'POST', token, organizationId, body: JSON.stringify({ name }) }); setName(''); await load(); } catch (e: unknown) { setError(e instanceof ApiError ? e.message : 'No se pudo crear la caja'); } }
  return <OwnerShell active="cash"><OwnerHeader eyebrow="Tesorería" title="Cajas registradoras" />{error && <p className="error-message">{error}</p>}<section className="content-grid"><article className="panel"><span className="eyebrow">Configuración</span><h2>Nueva caja</h2><form className="compact-form" onSubmit={createRegister}><label>Nombre<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Caja principal" /></label><button type="submit">Crear caja</button></form></article><article className="panel"><span className="eyebrow">Operación</span><h2>Cajas activas</h2>{registers.map((register) => <div className="list-row" key={register.id}><span><strong>{register.name}</strong><small>{register.description || 'Sin descripción'}</small></span><span className="role-badge">{register.status}</span></div>)}{!registers.length && <p className="muted">No hay cajas configuradas.</p>}</article></section></OwnerShell>;
}