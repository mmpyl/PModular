'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';

type BusinessType = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  defaultModules: unknown;
  productSchema: Record<string, unknown>;
};

export default function OnboardingPage() {
  const { token, organizationId, createOrganization } = useAuth();
  const router = useRouter();
  const [types, setTypes] = useState<BusinessType[]>([]);
  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    void apiFetch<BusinessType[]>('/business-types', { token })
      .then((items) => {
        setTypes(items);
        if (items[0]) setTypeId(items[0].id);
      })
      .catch((e: unknown) =>
        setError(e instanceof ApiError ? e.message : 'No se pudieron cargar los tipos de negocio')
      );
  }, [token]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!typeId) return;
    setBusy(true);
    try {
      await createOrganization({ name, businessTypeId: typeId });
      router.replace('/dashboard');
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'No se pudo crear el negocio');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ProtectedRoute requireOrganization={false}>
      {organizationId ? (
        <main className="auth-page">
          <h1>Tu negocio ya está configurado</h1>
          <button onClick={() => router.replace('/dashboard')}>Ir al dashboard</button>
        </main>
      ) : (
        <main className="auth-page">
          <span className="eyebrow">Primer paso</span>
          <h1>Configura tu negocio</h1>
          <p>Elige un rubro para activar módulos y atributos iniciales.</p>
          <form onSubmit={submit}>
            <label>
              Nombre comercial
              <input required value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              Tipo de negocio
              <select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </label>
            {types.find((type) => type.id === typeId) && (
              <p className="muted">{types.find((type) => type.id === typeId)?.description}</p>
            )}
            {error && <p className="error-message">{error}</p>}
            <button disabled={busy}>{busy ? 'Configurando...' : 'Crear negocio'}</button>
          </form>
        </main>
      )}
    </ProtectedRoute>
  );
}
