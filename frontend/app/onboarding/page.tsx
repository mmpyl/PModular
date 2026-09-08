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
  defaultModules: string[];
  productSchema: Record<string, unknown>;
};

const MODULE_LABELS: Record<string, string> = {
  inventario: 'Inventario',
  ventas: 'Ventas',
  compras: 'Compras',
  caja: 'Caja',
  lotes: 'Lotes',
  recetas: 'Recetas',
  fraccionamiento: 'Fraccionamiento',
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
        <main className="auth-page wide-auth">
          <span className="eyebrow">Primer paso</span>
          <h1>Configura tu negocio</h1>
          <p>Elige un rubro para activar los módulos y atributos iniciales.</p>
          {error && <p className="error-message">{error}</p>}

          <form onSubmit={submit} className="onboarding-form">
            <label>
              Nombre comercial
              <input required value={name} onChange={(e) => setName(e.target.value)} />
            </label>

            <fieldset className="business-type-options">
              <legend>Tipo de negocio</legend>
              {types.map((type) => {
                const modules = Array.isArray(type.defaultModules) ? type.defaultModules.filter((m): m is string => typeof m === 'string') : [];
                const schemaKeys = Object.keys(type.productSchema ?? {});
                return (
                  <label
                    key={type.id}
                    className={`business-type-card${type.id === typeId ? ' selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="businessType"
                      value={type.id}
                      checked={typeId === type.id}
                      onChange={() => setTypeId(type.id)}
                    />
                    <div className="business-type-copy">
                      <h3>{type.name}</h3>
                      {type.description && <p className="muted">{type.description}</p>}
                      <div className="module-list">
                        {modules.map((module) => (
                          <span className="module-chip" key={module}>
                            {MODULE_LABELS[module] ?? module}
                          </span>
                        ))}
                      </div>
                      {schemaKeys.length > 0 && (
                        <small className="schema-fields">
                          Atributos: {schemaKeys.map((k) => k.replace(/([A-Z])/g, ' $1').toLowerCase()).join(', ')}
                        </small>
                      )}
                    </div>
                  </label>
                );
              })}
            </fieldset>

            <button disabled={busy}>{busy ? 'Configurando...' : 'Crear negocio'}</button>
          </form>
        </main>
      )}
    </ProtectedRoute>
  );
}
