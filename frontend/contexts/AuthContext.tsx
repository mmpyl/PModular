'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, ApiError, AuthResponse, AuthUser, Membership } from '@/lib/api';

type Credentials = { email: string; password: string };
type RegisterPayload = Credentials & { name?: string };
export type BusinessType = { id: string; code: string; name: string; description?: string | null; defaultModules: unknown; productSchema: Record<string, unknown> };

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  memberships: Membership[];
  organizationId: string | null;
  orgRole: Membership['role'] | null;
  activeMembership: Membership | null;
  enabledModules: string[];
  isHydrated: boolean;
  isAuthenticated: boolean;
  login: (credentials: Credentials) => Promise<void>;
  selectOrganization: (organizationId: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  createOrganization: (payload: { name: string; businessTypeId: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = 'pymen.auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    try {
      if (stored) {
        const parsed = JSON.parse(stored) as AuthResponse;
        if (parsed.accessToken && parsed.user?.email) {
          setSession(parsed);
          setToken(parsed.accessToken);
          setUser(parsed.user);
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      setToken(null);
      setUser(null);
      setSession(null);
      window.localStorage.removeItem(STORAGE_KEY);
    };
    window.addEventListener('pymodular:session-expired', handleExpired);
    return () => window.removeEventListener('pymodular:session-expired', handleExpired);
  }, []);

  const persistSession = (session: AuthResponse) => {
    setToken(session.accessToken);
    setUser(session.user);
    setSession(session);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  };

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user,
    memberships: session?.memberships ?? [],
    organizationId: session?.organizationId ?? null,
    orgRole: session?.orgRole ?? null,
    activeMembership: session?.memberships?.find((membership) => membership.organizationId === session.organizationId) ?? null,
    enabledModules: (() => {
      const membership = session?.memberships?.find((item) => item.organizationId === session.organizationId);
      const configured = membership?.organization.enabledModules;
      const defaults = membership?.organization.businessType?.defaultModules;
      const modules = Array.isArray(configured) && configured.length ? configured : defaults;
      return Array.isArray(modules) ? modules.filter((module): module is string => typeof module === 'string') : [];
    })(),
    isHydrated,
    isAuthenticated: Boolean(token),
    login: async (credentials) => {
      const session = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      persistSession(session);
    },
    selectOrganization: async (organizationId) => {
      if (!token) throw new ApiError('La sesion ha expirado', 401);
      const selected = await apiFetch<AuthResponse>('/auth/select-organization', {
        method: 'POST',
        token,
        body: JSON.stringify({ organizationId }),
      });
      persistSession({ ...selected, memberships: session?.memberships });
    },
    register: async (payload) => {
      const session = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      persistSession(session);
    },
    createOrganization: async (payload) => {
      if (!token) throw new ApiError('La sesion ha expirado', 401);
      const organization = await apiFetch<{ id: string }>('/organizations', {
        method: 'POST', token, body: JSON.stringify(payload),
      });
      const selected = await apiFetch<AuthResponse>('/auth/select-organization', {
        method: 'POST', token, body: JSON.stringify({ organizationId: organization.id }),
      });
      persistSession(selected);
    },
    logout: () => {
      setToken(null);
      setUser(null);
      setSession(null);
      window.localStorage.removeItem(STORAGE_KEY);
    },
  }), [isHydrated, session, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
