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
    <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear Organización
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Registra tu empresa para comenzar a usar PymeN
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre de la organización
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Mi Empresa S.A."
            />
          </div>

          <div>
            <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
              Tipo de negocio
            </label>
            <select
              id="businessType"
              required
              value={businessTypeId}
              onChange={(e) => setBusinessTypeId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Selecciona un tipo de negocio</option>
              {businessTypes.map((bt) => (
                <option key={bt.id} value={bt.id}>
                  {bt.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !name || !businessTypeId}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando...' : 'Crear organización'}
          </button>
        </form>
      </div>
    </main>
  );
}
