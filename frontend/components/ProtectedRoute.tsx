'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Componente para proteger rutas que requieren organización.
 * Por defecto requiere organizationId, pero puede usarse en modo plataforma.
 */
export function ProtectedRoute({ 
  children, 
  requireOrganization = true,
  requirePlatform = false 
}: { 
  children: ReactNode; 
  requireOrganization?: boolean;
  requirePlatform?: boolean;
}) {
  const { isAuthenticated, isHydrated, organizationId, platformRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (!isHydrated) return;
    
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    
    // Modo plataforma: solo requiere platformRole
    if (requirePlatform) {
      if (!platformRole || !['PLATFORM_ADMIN', 'SUPPORT'].includes(platformRole)) {
        router.replace('/dashboard');
        return;
      }
    }
    // Modo organización: requiere organizationId
    else if (requireOrganization && !organizationId && pathname !== '/select-organization') {
      router.replace('/select-organization');
      return;
    }
  }, [isAuthenticated, isHydrated, organizationId, platformRole, pathname, requireOrganization, requirePlatform, router]);

  // Loading state para modo plataforma
  if (requirePlatform && (!isHydrated || !isAuthenticated || !platformRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Verificando permisos...</p>
      </div>
    );
  }

  // Loading state para modo organización
  if (!isHydrated || !isAuthenticated || (requireOrganization && !organizationId)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Redirigiendo a inicio de sesión...</p>
      </div>
    );
  }

  return <>{children}</>;
}
