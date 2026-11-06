'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export function PlatformRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isHydrated, organizationId, platformRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace('/platform/login');
    } else if (platformRole !== 'PLATFORM_ADMIN') {
      router.replace(organizationId ? '/dashboard' : '/select-organization');
    }
  }, [isAuthenticated, isHydrated, organizationId, platformRole, router]);

  if (!isHydrated || !isAuthenticated || platformRole !== 'PLATFORM_ADMIN') {
    return <main className="platform-loading">Verificando acceso...</main>;
  }

  return <>{children}</>;
}