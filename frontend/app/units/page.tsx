'use client';

import { FormEvent, useEffect, useState } from 'react';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { RequireRole } from '@/components/RequireRole';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';

type Unit = { id: string; name: string; symbol?: string | null; isFractionable: boolean };

// Crear/editar: OWNER/ADMIN/INVENTARIO. Eliminar: solo OWNER/ADMIN (backend).
const WRITE_ROLES = ['OWNER', 'ADMIN', 'INVENTARIO'];
const DELETE_ROLES = ['OWNER', 'ADMIN'];

export default function UnitsPage() {
  const { token, organizationId } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [isFractionable, setIsFractionable] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    if (!token || !organizationId) return;
    try { setUnits(await apiFetch<Unit[]>('/units-of-measure', { token, organizationId })); }
    catch (e: unknown) { setError(e instanceof ApiError ? e.message : 'No se pudieron cargar las unidades'); }
  };

  function resetForm() { setName(''); setSymbol(''); setIsFractionable(false); setEditingId(null); setMessage(''); }

  function startEdit(unit: Unit) {
    setEditingId(unit.id); setName(unit.name); setSymbol(unit.symbol ?? ''); setIsFractionable(unit.isFractionable);
    setMessage(''); setError('');
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !organizationId) return;
    const body = JSON.stringify({ name, symbol: symbol || undefined, isFractionable });
    try {
      if (editingId) {
        await apiFetch(`/units-of-measure/${editingId}`, { method: 'PATCH', token, organizationId, body });
        setMessage('Unidad actualizada correctamente');
      } else {
        await apiFetch('/units-of-measure', { method: 'POST', token, organizationId, body });
        setMessage('Unidad creada correctamente');
      }
      setError(''); resetForm(); await load();
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar la unidad');
    }
  }

  async function remove(unit: Unit) {
    if (!token || !organizationId) return;
    if (!window.confirm(`¿Eliminar la unidad "${unit.name}"?`)) return;
    try {
      await apiFetch(`/units-of-measure/${unit.id}`, { method: 'DELETE', token, organizationId });
      setMessage(`Unidad "${unit.name}" eliminada`); setError('');
      await load();
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'No se pudo eliminar la unidad');
    }
  }

  useEffect(() => { void load(); }, [token, organizationId]);

  return (
<OwnerShell active="units">
      <OwnerHeader eyebrow="Catálogo" title="Unidades de medida" />
      {error && <p className="error-message" role="alert">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      <RequireRole roles={WRITE_ROLES}>
        <section className="panel">
          <span className="eyebrow">{editingId ? 'Edición' : 'Alta'}</span>
          <h2>{editingId ? 'Editar unidad' : 'Nueva unidad'}</h2>
          <form className="compact-form" onSubmit={save}>
            <label>Nombre<input required value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label>Símbolo<input value={symbol} onChange={(e) => setSymbol(e.target.value)} /></label>
            <label className="fractionable-field">
              ¿Vendible fraccionado?
              <input type="checkbox" checked={isFractionable} onChange={(e) => setIsFractionable(e.target.checked)} />
            </label>
            {editingId && <button type="button" className="quiet-link" onClick={resetForm}>Cancelar edición</button>}
            <button type="submit">{editingId ? 'Guardar cambios' : 'Agregar unidad'}</button>
          </form>
        </section>
      </RequireRole>

      <section className="panel">
        <div className="panel-heading">
          <div><span className="eyebrow">Catálogo</span><h2>Unidades disponibles</h2></div>
          <span className="role-badge">{units.length} unidades</span>
        </div>
        {units.map((unit) => (
          <div className="list-row" key={unit.id}>
            <span>
              <strong>{unit.name}</strong>
              <small>{unit.symbol || 'Sin símbolo'}{unit.isFractionable ? ' · Fraccionable' : ''}</small>
            </span>
            <RequireRole roles={WRITE_ROLES}>
              <div className="row-actions">
                <button type="button" className="quiet-link" onClick={() => startEdit(unit)}>Editar</button>
              </div>
            </RequireRole>
            <RequireRole roles={DELETE_ROLES}>
              <div className="row-actions">
                <button type="button" className="danger" onClick={() => void remove(unit)}>Eliminar</button>
              </div>
            </RequireRole>
          </div>
        ))}
        {!units.length && <p className="muted">No hay unidades registradas.</p>}
      </section>
    </OwnerShell>
  );
}