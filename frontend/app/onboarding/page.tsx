'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
        <main className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Tu negocio ya está configurado</h1>
            <Button onClick={() => router.replace('/dashboard')}>Ir al dashboard</Button>
          </div>
        </main>
      ) : (
        <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-2xl w-full space-y-6">
            <div className="space-y-2 text-center">
              <p className="text-sm font-medium text-muted-foreground">Primer paso</p>
              <h1 className="text-3xl font-bold tracking-tight">Configura tu negocio</h1>
              <p className="text-muted-foreground">Elige un rubro para activar los módulos y atributos iniciales.</p>
            </div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

            <form onSubmit={submit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="business-name">Nombre comercial</Label>
                <Input id="business-name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <fieldset className="space-y-4">
                <legend className="text-sm font-medium">Tipo de negocio</legend>
                <div className="grid gap-4 md:grid-cols-2">
                  {types.map((type) => {
                    const modules = Array.isArray(type.defaultModules) ? type.defaultModules.filter((m): m is string => typeof m === 'string') : [];
                    const schemaKeys = Object.keys(type.productSchema ?? {});
                    return (
                      <label
                        key={type.id}
                        className={`block p-4 border rounded-lg cursor-pointer transition-all ${type.id === typeId ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' : 'hover:border-gray-300'}`}
                      >
                        <input
                          type="radio"
                          name="businessType"
                          value={type.id}
                          checked={typeId === type.id}
                          onChange={() => setTypeId(type.id)}
                          className="sr-only"
                        />
                        <div className="space-y-2">
                          <h3 className="font-semibold">{type.name}</h3>
                          {type.description && <p className="text-sm text-muted-foreground">{type.description}</p>}
                          <div className="flex flex-wrap gap-1">
                            {modules.map((module) => (
                              <span key={module} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                {MODULE_LABELS[module] ?? module}
                              </span>
                            ))}
                          </div>
                          {schemaKeys.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Atributos: {schemaKeys.map((k) => k.replace(/([A-Z])/g, ' $1').toLowerCase()).join(', ')}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <Button type="submit" disabled={busy} className="w-full">{busy ? 'Configurando...' : 'Crear negocio'}</Button>
            </form>
          </div>
        </main>
      )}
    </ProtectedRoute>
  );
}
