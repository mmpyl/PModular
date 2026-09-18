'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

type BusinessType = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
};

export default function CreateOrganizationPage() {
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [name, setName] = useState('');
  const [businessTypeId, setBusinessTypeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.replace('/login');
      return;
    }

    // Cargar tipos de negocio disponibles
    apiFetch<BusinessType[]>('/business-types', { token })
      .then(setBusinessTypes)
      .catch((err) => {
        console.error('Error loading business types:', err);
        setError('No se pudo cargar la lista de tipos de negocio');
      });
  }, [isAuthenticated, token, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Crear la organización
      const organization = await apiFetch<{ id: string }>('/organizations', {
        method: 'POST',
        token: token!,
        body: JSON.stringify({ name, businessTypeId }),
      });

      // 2. Auto-asignarse como OWNER (esto debería hacerse en el backend)
      // El endpoint de organizaciones debería crear la membresía automáticamente
      // Por ahora, asumimos que el backend ya lo hace

      // Redirigir al dashboard
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError(String(err.message));
      } else {
        setError('Error al crear la organización');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Cargando...</p>
      </div>
    );
  }

  return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-white">
      {!isAuthenticated ? (
        <p className="text-muted-foreground">Cargando...</p>
      ) : (
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-sm font-medium text-muted-foreground">Crear organización</p>
            <h1 className="text-3xl font-bold tracking-tight">Registra tu empresa</h1>
            <p className="text-muted-foreground">Completa los datos para comenzar a usar PymeN.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            
            <div className="space-y-2">
              <Label htmlFor="org-name">Nombre de la organización</Label>
              <Input
                id="org-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mi Empresa S.A."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-type">Tipo de negocio</Label>
               <select
                required
                value={businessTypeId}
                onChange={(e) => setBusinessTypeId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecciona un tipo de negocio</option>
                {businessTypes.map((bt) => (
                  <option key={bt.id} value={bt.id}>
                    {bt.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              disabled={loading || !name || !businessTypeId}
              className="w-full"
            >
              {loading ? 'Creando...' : 'Crear organización'}
            </Button>
          </form>
        </div>
      )}
    </main>
  );
}
