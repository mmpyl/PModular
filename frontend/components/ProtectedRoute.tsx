'use client';

<<<<<<< HEAD
import { usePathname, useRouter } from 'next/navigation';
=======
import { useRouter, usePathname } from 'next/navigation';
>>>>>>> 8f7b97ccc2e38d7b74af818d2a0a76d13f3dfb52
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';

<<<<<<< HEAD
export function ProtectedRoute({ children, requireOrganization = true }: { children: ReactNode; requireOrganization?: boolean }) {
  const { isAuthenticated, isHydrated, organizationId } = useAuth();
=======
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, token } = useAuth();
>>>>>>> 8f7b97ccc2e38d7b74af818d2a0a76d13f3dfb52
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace('/login');
<<<<<<< HEAD
    } else if (requireOrganization && !organizationId && pathname !== '/select-organization') {
      router.replace('/select-organization');
    }
  }, [isAuthenticated, isHydrated, organizationId, pathname, requireOrganization, router]);

  if (!isHydrated || !isAuthenticated || (requireOrganization && !organizationId)) {
    return <p>Redirigiendo a inicio de sesión...</p>;
=======
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
>>>>>>> 8f7b97ccc2e38d7b74af818d2a0a76d13f3dfb52
  }

  return <>{children}</>;
}
