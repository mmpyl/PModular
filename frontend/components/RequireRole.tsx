'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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
