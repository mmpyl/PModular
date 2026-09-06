'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function SelectOrganizationPage() {
  const { memberships, selectOrganization, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Si ya tiene organización seleccionada, redirigir al dashboard
    if (memberships.length === 0) {
      // No tiene membresías, redirigir a crear organización
      router.replace('/create-organization');
    } else if (memberships.length === 1 && memberships[0].organizationId) {
      // Solo tiene una membresía, seleccionar automáticamente
      selectOrganization(memberships[0].organizationId);
      router.replace('/dashboard');
    }
  }, [isAuthenticated, memberships, selectOrganization, router]);

  const handleSelect = async (organizationId: string) => {
    await selectOrganization(organizationId);
    router.push('/dashboard');
  };

  if (!isAuthenticated || memberships.length === 0) {
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
            Seleccionar Organización
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Tienes acceso a múltiples organizaciones. Elige una para continuar.
          </p>
        </div>
        <div className="mt-8 space-y-4">
          {memberships.map((membership) => (
            <button
              key={membership.organizationId}
              onClick={() => handleSelect(membership.organizationId)}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <div className="flex flex-col items-start">
                <span className="font-semibold">
                  {membership.organization?.name || 'Organización'}
                </span>
                <span className="text-xs text-gray-500">
                  Rol: {membership.role}
                </span>
              </div>
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
