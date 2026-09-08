'use client';

import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';

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
    <main className="auth-page">
      {!isAuthenticated ? (
        <p className="loading-message">Cargando...</p>
      ) : (
        <>
          <span className="eyebrow">Crear organización</span>
          <h1>Registra tu empresa</h1>
          <p>Completa los datos para comenzar a usar PymeN.</p>
          <form onSubmit={handleSubmit}>
            {error && <p className="error-message">{error}</p>}
            
            <label>
              Nombre de la organización
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mi Empresa S.A."
              />
            </label>

            <label>
              Tipo de negocio
              <select
                required
                value={businessTypeId}
                onChange={(e) => setBusinessTypeId(e.target.value)}
              >
                <option value="">Selecciona un tipo de negocio</option>
                {businessTypes.map((bt) => (
                  <option key={bt.id} value={bt.id}>
                    {bt.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={loading || !name || !businessTypeId}
            >
              {loading ? 'Creando...' : 'Crear organización'}
            </button>
          </form>
        </>
      )}
    </main>
  );
}
