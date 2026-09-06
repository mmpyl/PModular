'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, AuthResponse, Membership, ApiError } from '@/lib/api';

type Credentials = { email: string; password: string };
type RegisterPayload = Credentials & { name?: string };

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  organizationId: string | null;
  orgRole: string | null;
  platformRole: string | null;
  memberships: Membership[];
  isHydrated: boolean;
  isAuthenticated: boolean;
  login: (credentials: Credentials) => Promise<void>;
  selectOrganization: (organizationId: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  createOrganization: (payload: { name: string; businessTypeId: string }) => Promise<void>;
  logout: () => void;
  hasOrgRole: (roles: string[]) => boolean;
};

type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  platformRole?: string | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = 'pymen.auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [orgRole, setOrgRole] = useState<string | null>(null);
  const [platformRole, setPlatformRole] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Cargar sesión almacenada al iniciar
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const session = JSON.parse(stored) as AuthResponse;
        setToken(session.accessToken);
        setUser(session.user);
        setOrganizationId(session.organizationId ?? null);
        setOrgRole(session.orgRole ?? null);
        setPlatformRole(session.platformRole ?? null);
        setMemberships(session.memberships ?? []);
      } catch {
        // Sesión inválida, limpiar
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsHydrated(true);
  }, []);

  const persistSession = useCallback((session: AuthResponse) => {
    setToken(session.accessToken);
    setUser(session.user);
    setOrganizationId(session.organizationId ?? null);
    setOrgRole(session.orgRole ?? null);
    setPlatformRole(session.platformRole ?? null);
    setMemberships(session.memberships ?? []);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    setOrganizationId(null);
    setOrgRole(null);
    setPlatformRole(null);
    setMemberships([]);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Escuchar evento de sesión expirada
  useEffect(() => {
    const handleExpired = () => {
      clearSession();
      router.replace('/login');
    };
    window.addEventListener('pymodular:session-expired', handleExpired);
    return () => window.removeEventListener('pymodular:session-expired', handleExpired);
  }, [clearSession, router]);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user,
    organizationId,
    orgRole,
    platformRole,
    memberships,
    isHydrated,
    isAuthenticated: Boolean(token),
    login: async (credentials) => {
      const session = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      persistSession(session);
      
      // Si el login devuelve múltiples membresías sin organización seleccionada, redirigir a selector
      if (session.memberships && session.memberships.length > 1 && !session.organizationId) {
        router.push('/select-organization');
      }
    },
    selectOrganization: async (orgId: string) => {
      if (!token) throw new ApiError('La sesión ha expirado', 401);
      const session = await apiFetch<AuthResponse>('/auth/select-organization', {
        method: 'POST',
        token,
        body: JSON.stringify({ organizationId: orgId }),
      });
      persistSession(session);
    },
    register: async (payload) => {
      const session = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      persistSession(session);
    },
    createOrganization: async (payload) => {
      if (!token) throw new ApiError('La sesión ha expirado', 401);
      const organization = await apiFetch<{ id: string }>('/organizations', {
        method: 'POST',
        token,
        body: JSON.stringify(payload),
      });
      const session = await apiFetch<AuthResponse>('/auth/select-organization', {
        method: 'POST',
        token,
        body: JSON.stringify({ organizationId: organization.id }),
      });
      persistSession(session);
    },
    logout: clearSession,
    hasOrgRole: (roles: string[]) => {
      if (!orgRole) return false;
      return roles.includes(orgRole);
    },
  }), [token, user, organizationId, orgRole, platformRole, memberships, isHydrated, persistSession, clearSession, router]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
