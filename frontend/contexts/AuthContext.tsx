'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, AuthResponse, Membership, ApiError } from '@/lib/api';

type Credentials = { email: string; password: string };
type RegisterPayload = Credentials & { name?: string };

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  organizationId: string | null;
  orgRole: string | null;
  platformRole: string | null;
  memberships: Membership[];
  login: (credentials: Credentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  selectOrganization: (organizationId: string) => Promise<void>;
  hasOrgRole: (roles: string[]) => boolean;
};

type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  platformRole?: string;
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

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user,
    isAuthenticated: Boolean(token),
    organizationId,
    orgRole,
    platformRole,
    memberships,
    login: async (credentials) => {
      const session = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      persistSession(session);
      
      // Si el login devuelve múltiples membresías, redirigir a selector
      if (session.memberships && session.memberships.length > 1 && !session.organizationId) {
        router.push('/select-organization');
      }
    },
    register: async (payload) => {
      const session = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      persistSession(session);
    },
    logout: clearSession,
    selectOrganization: async (orgId: string) => {
      const session = await apiFetch<AuthResponse>('/auth/select-organization', {
        method: 'POST',
        token: token!,
        body: JSON.stringify({ organizationId: orgId }),
      });
      persistSession(session);
    },
    hasOrgRole: (roles: string[]) => {
      if (!orgRole) return false;
      return roles.includes(orgRole);
    },
  }), [token, user, organizationId, orgRole, platformRole, memberships, persistSession, clearSession, router]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
