'use client';

import { FormEvent, useEffect, useState } from 'react';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';

type Unit = { id: string; name: string; symbol?: string | null; isFractionable: boolean };
export default function UnitsPage() {
  const { token, organizationId, orgRole } = useAuth(); const [units, setUnits] = useState<Unit[]>([]); const [name, setName] = useState(''); const [symbol, setSymbol] = useState(''); const [error, setError] = useState('');
  const load = async () => { if (!token || !organizationId) return; try { setUnits(await apiFetch<Unit[]>('/units-of-measure', { token, organizationId })); } catch (e: unknown) { setError(e instanceof ApiError ? e.message : 'No se pudieron cargar las unidades'); } };
  useEffect(() => { void load(); }, [organizationId, token]);
  async function create(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!token || !organizationId) return; try { await apiFetch('/units-of-measure', { method: 'POST', token, organizationId, body: JSON.stringify({ name, symbol }) }); setName(''); setSymbol(''); await load(); } catch (e: unknown) { setError(e instanceof ApiError ? e.message : 'No se pudo crear la unidad'); } }
  return <OwnerShell active="products"><OwnerHeader eyebrow="Catálogo" title="Unidades de medida" />{error && <p className="error-message">{error}</p>}<section className="content-grid">{orgRole !== 'VENDEDOR' && <article className="panel"><h2>Nueva unidad</h2><form className="compact-form" onSubmit={create}><label>Nombre<input required value={name} onChange={(e) => setName(e.target.value)} /></label><label>Símbolo<input value={symbol} onChange={(e) => setSymbol(e.target.value)} /></label><button>Agregar unidad</button></form></article>}<article className="panel"><h2>Unidades disponibles</h2>{units.map((unit) => <div className="list-row" key={unit.id}><span>{unit.name}</span><small>{unit.symbol || 'Sin símbolo'}</small></div>)}{!units.length && <p className="muted">No hay unidades registradas.</p>}</article></section></OwnerShell>;
}