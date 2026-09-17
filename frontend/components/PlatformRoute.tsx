'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Componente para proteger rutas del panel de plataforma (/platform).
 * Requiere que el usuario tenga un platformRole (PLATFORM_ADMIN o SUPPORT).
 * No requiere organizationId, ya que los usuarios de plataforma no pertenecen a una organización específica.
 */
export function PlatformRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isHydrated, platformRole, organizationId } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Si el usuario tiene organizationId, probablemente es un usuario normal, no de plataforma
    // Pero permitimos acceso si también tiene platformRole
    if (!platformRole || !['PLATFORM_ADMIN', 'SUPPORT'].includes(platformRole)) {
      // Usuario no autorizado para panel de plataforma
      router.replace('/dashboard');
      return;
    }
  }, [isAuthenticated, isHydrated, platformRole, organizationId, pathname, router]);

  if (!isHydrated || !isAuthenticated || !platformRole) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Verificando permisos de plataforma...</p>
      </div>
    );
  }

  return <>{children}</>;
}
