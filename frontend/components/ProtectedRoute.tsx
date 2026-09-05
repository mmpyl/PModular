'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Manejar errores 401/403 a nivel de interceptor
    const handleApiError = (event: CustomEvent<ApiError>) => {
      const error = event.detail;
      if (error.status === 401) {
        // Sesión expirada o inválida
        router.replace('/login');
      } else if (error.status === 403) {
        // No tiene permisos - podríamos mostrar una página de "acceso denegado"
        console.warn('Acceso denegado:', error.message);
      }
    };

    window.addEventListener('api-error', handleApiError as EventListener);
    return () => {
      window.removeEventListener('api-error', handleApiError as EventListener);
    };
  }, [isAuthenticated, router, pathname]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Redirigiendo a inicio de sesión...</p>
      </div>
    );
  }

  return <>{children}</>;
}
