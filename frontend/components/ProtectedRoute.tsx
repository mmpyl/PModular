'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children, requireOrganization = true }: { children: ReactNode; requireOrganization?: boolean }) {
  const { isAuthenticated, isHydrated, organizationId, platformRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (platformRole === 'PLATFORM_ADMIN') {
      router.replace('/platform');
      return;
    }
    
    if (requireOrganization && !organizationId && pathname !== '/select-organization') {
      router.replace('/select-organization');
      return;
    }
  }, [isAuthenticated, isHydrated, organizationId, pathname, platformRole, requireOrganization, router]);

  if (!isHydrated || !isAuthenticated || platformRole === 'PLATFORM_ADMIN' || (requireOrganization && !organizationId)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Redirigiendo a inicio de sesión...</p>
      </div>
    );
  }

  return <>{children}</>;
}
