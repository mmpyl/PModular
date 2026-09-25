'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, AuthResponse, Membership, ApiError, setAuthToken } from '@/lib/api';

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
  platformLogin: (credentials: Credentials) => Promise<void>;
  logout: () => void;
  hasOrgRole: (roles: string[]) => boolean;
  persistSession: (session: AuthResponse) => Promise<void>;
  refreshMemberships: () => Promise<void>;
};

type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  platformRole?: string | null;
  imageUrl?: string | null;
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

  // Cargar sesión almacenada al iniciar (priorizar cookie httpOnly, fallback a localStorage)
  useEffect(() => {
    const loadSession = async () => {
      // Intentar obtener token y datos desde cookie httpOnly primero
      try {
        const response = await fetch('/api/auth/cookie', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();

          if (data.token) {
            const session: AuthResponse = {
              accessToken: data.token,
              user: data.user,
              organizationId: data.organizationId,
              orgRole: data.orgRole,
              platformRole: data.platformRole,
              memberships: [],
            };
            setToken(session.accessToken);
            setUser(session.user);
            setOrganizationId(session.organizationId ?? null);
            setOrgRole(session.orgRole ?? null);
            setPlatformRole(session.platformRole ?? null);
            setMemberships(session.memberships ?? []);
            setAuthToken(session.accessToken);
            setIsHydrated(true);
            return;
          }
        }
      } catch {
        // Ignorar errores de cookie, intentar fallback
      }

      // Fallback a localStorage para compatibilidad
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
          setAuthToken(session.accessToken);
        } catch {
          // Sesión inválida, limpiar
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
      setIsHydrated(true);
    };

    loadSession();
  }, []);

  const persistSession = useCallback(async (session: AuthResponse) => {
    setToken(session.accessToken);
    setUser(session.user);
    setOrganizationId(session.organizationId ?? null);
    setOrgRole(session.orgRole ?? null);
    setPlatformRole(session.platformRole ?? null);
    setMemberships(session.memberships ?? []);

    // Actualizar token global para apiFetch
    setAuthToken(session.accessToken);

    // Establecer cookie httpOnly vía Route Handler
    try {
      await fetch('/api/auth/cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: session.accessToken }),
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error al establecer cookie:', error);
      // Fallback a localStorage si falla la cookie
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }, []);

  const clearSession = useCallback(async () => {
    setToken(null);
    setUser(null);
    setOrganizationId(null);
    setOrgRole(null);
    setPlatformRole(null);
    setMemberships([]);

    // Limpiar token global para apiFetch
    setAuthToken(null);

    // Eliminar cookie httpOnly vía Route Handler
    try {
      await fetch('/api/auth/cookie', {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error al eliminar cookie:', error);
    }

    // Limpiar localStorage también para fallback
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Escuchar evento de sesión expirada (los usuarios de plataforma van a /platform/login)
  useEffect(() => {
    const handleExpired = (event: Event) => {
      const detail = (event as CustomEvent<{ platformRole?: string | null }>).detail;
      const isPlatformUser = Boolean(detail?.platformRole);
      clearSession();
      router.replace(isPlatformUser ? '/platform/login' : '/login');
    };
    window.addEventListener('pymodular:session-expired', handleExpired);
    return () => window.removeEventListener('pymodular:session-expired', handleExpired);
  }, [clearSession, router]);

  // Hidratar memberships al recargar: la cookie solo trae el JWT (sin membresías),
  // así que las pedimos al backend (GET /memberships/user/:id permite al propio usuario)
  const refreshMemberships = useCallback(async () => {
    if (!user?.id) return;
    try {
      const fresh = await apiFetch<Membership[]>(`/memberships/user/${user.id}`);
      if (Array.isArray(fresh)) setMemberships(fresh);
    } catch {
      // Si falla, mantener las memberships actuales (posible fallo de red transitorio)
    }
  }, [user?.id]);

  useEffect(() => {
    if (token && user?.id) {
      void refreshMemberships();
    }
  }, [token, user?.id, refreshMemberships]);

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
      // Esperar a que la sesión quede persistida (cookie httpOnly) antes de navegar
      await persistSession(session);
      
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
      await persistSession(session);
    },
    platformLogin: async (credentials) => {
      // Primero login normal para obtener el token, luego intercambio a token de plataforma
      const loginResponse = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      const session = await apiFetch<AuthResponse>('/auth/platform/login', {
        method: 'POST',
        token: loginResponse.accessToken,
      });
      await persistSession(session);
    },
    register: async (payload) => {
      const session = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await persistSession(session);
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
      await persistSession(session);
    },
    logout: clearSession,
    hasOrgRole: (roles: string[]) => {
      if (!orgRole) return false;
      return roles.includes(orgRole);
    },
    persistSession,
    refreshMemberships,
  }), [token, user, organizationId, orgRole, platformRole, memberships, isHydrated, persistSession, clearSession, refreshMemberships, router]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
