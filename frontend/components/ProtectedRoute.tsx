'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children, requireOrganization = true }: { children: ReactNode; requireOrganization?: boolean }) {
  const { isAuthenticated, isHydrated, organizationId } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (requireOrganization && !organizationId && pathname !== '/select-organization') {
      router.replace('/select-organization');
    }
  }, [isAuthenticated, isHydrated, organizationId, pathname, requireOrganization, router]);

  if (!isHydrated || !isAuthenticated || (requireOrganization && !organizationId)) {
    return <p>Redirigiendo a inicio de sesión...</p>;
  }

  return <>{children}</>;
}
