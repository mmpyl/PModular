'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function RequireRole({ roles, children, fallback }: { roles: string[]; children: ReactNode; fallback?: ReactNode }) {
  const { orgRole } = useAuth();
  if (!orgRole || !roles.includes(orgRole)) return <>{fallback ?? null}</>;
  return <>{children}</>;
}