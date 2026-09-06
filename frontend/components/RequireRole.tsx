'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
<<<<<<< HEAD

export function RequireRole({ roles, children, fallback }: { roles: string[]; children: ReactNode; fallback?: ReactNode }) {
  const { orgRole } = useAuth();
  if (!orgRole || !roles.includes(orgRole)) return <>{fallback ?? null}</>;
  return <>{children}</>;
}
=======
import { useRouter } from 'next/navigation';

interface RequireRoleProps {
  children: ReactNode;
  roles: string[]; // Ej: ['OWNER', 'ADMIN']
  fallback?: ReactNode;
  redirectOnFail?: boolean;
}

/**
 * Componente que muestra su contenido solo si el usuario tiene uno de los roles especificados.
 * Espejo frontend del OrgRolesGuard del backend (nunca como única defensa).
 * 
 * @example
 * <RequireRole roles={['OWNER', 'ADMIN']}>
 *   <button>Eliminar producto</button>
 * </RequireRole>
 */
export function RequireRole({ 
  children, 
  roles, 
  fallback = null,
  redirectOnFail = false 
}: RequireRoleProps) {
  const { orgRole, isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated) {
    return null;
  }

  const hasRole = orgRole ? roles.includes(orgRole) : false;

  if (redirectOnFail && !hasRole) {
    router.push('/dashboard');
    return null;
  }

  if (!hasRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default RequireRole;
>>>>>>> 8f7b97ccc2e38d7b74af818d2a0a76d13f3dfb52
