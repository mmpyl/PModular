'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, Membership, ApiError, type SessionResponse } from '@/lib/api';

type Credentials = { email: string; password: string };
type RegisterPayload = Credentials & { name?: string };

type AuthContextValue = {
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

/**
 * AuthProvider (Fase 2 - BFF).
 *
 * El estado en memoria NO contiene ningún JWT: solo datos seguros de sesión
 * (user, rol, memberships) que vienen de /api/auth/session y /api/auth/login.
 * La autenticación real vive en la cookie httpOnly; el navegador jamás ve el token.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [orgRole, setOrgRole] = useState<string | null>(null);
  const [platformRole, setPlatformRole] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  // La cookie httpOnly existe y su firma valida => hay sesión
  const [hasSession, setHasSession] = useState(false);

  const applySession = useCallback((data: Partial<SessionResponse> & { authenticated?: boolean }) => {
    setHasSession(data.authenticated !== false && Boolean(data.user));
    setUser((data.user as AuthUser) ?? null);
    setOrganizationId(data.organizationId ?? null);
    setOrgRole((data.orgRole as string) ?? null);
    setPlatformRole(data.platformRole ?? null);
    setMemberships(Array.isArray(data.memberships) ? data.memberships : []);
  }, []);

  const clearLocal = useCallback(() => {
    setHasSession(false);
    setUser(null);
    setOrganizationId(null);
    setOrgRole(null);
    setPlatformRole(null);
    setMemberships([]);
  }, []);

  // Hidratar desde el BFF: GET /api/auth/session (devuelve la sesión SIN el token)
  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (response.ok) {
          const data = (await response.json()) as SessionResponse & { authenticated?: boolean };
          applySession(data);
        } else if (response.status === 401) {
          clearLocal();
          // Limpieza defensiva del localStorage legado (tarea 2.5):
          // antes la sesión (con token) se guardaba ahí; ya no se usa nunca más.
          try {
            window.localStorage.removeItem('pymen.auth');
          } catch {
            /* almacenamiento no disponible */
          }
        }
      } catch {
        clearLocal();
      } finally {
        setIsHydrated(true);
      }
    };

    loadSession();
  }, [applySession, clearLocal]);

  // Escuchar evento de sesión expirada (los usuarios de plataforma van a /platform/login)
  useEffect(() => {
    const handleExpired = (event: Event) => {
      const detail = (event as CustomEvent<{ platformRole?: string | null }>).detail;
      const isPlatformUser = Boolean(detail?.platformRole);
      clearLocal();
      void fetch('/api/auth/logout', { method: 'DELETE', credentials: 'include' }).catch(() => {});
      router.replace(isPlatformUser ? '/platform/login' : '/login');
    };
    window.addEventListener('pymodular:session-expired', handleExpired);
    return () => window.removeEventListener('pymodular:session-expired', handleExpired);
  }, [clearLocal, router]);

  // Miembros del equipo/invitaciones pueden cambiar: revalidar membresías bajo demanda
  const refreshMemberships = useCallback(async () => {
    if (!hasSession) return;
    try {
      const fresh = await apiFetch<Membership[]>('/auth/memberships');
      if (Array.isArray(fresh)) setMemberships(fresh);
    } catch {
      // Si falla, mantener las memberships actuales (posible fallo de red transitorio)
    }
  }, [hasSession]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    organizationId,
    orgRole,
    platformRole,
    memberships,
    isHydrated,
    isAuthenticated: hasSession,
    login: async (credentials) => {
      // POST /api/auth/login (BFF): guarda el JWT en cookie httpOnly y devuelve
      // solo user, rol y memberships — nunca el token.
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });
      const session = (await res.json().catch(() => ({}))) as SessionResponse & { message?: string };
      if (!res.ok) {
        throw new ApiError(session?.message ?? 'No se pudo iniciar sesión', res.status, session);
      }
      applySession(session);

      // Si el login devuelve múltiples membresías sin organización seleccionada, redirigir a selector
      if (session.memberships && session.memberships.length > 1 && !session.organizationId) {
        router.push('/select-organization');
      }
    },
    selectOrganization: async (orgId: string) => {
      if (!hasSession) throw new ApiError('La sesión ha expirado', 401);
      const res = await fetch('/api/auth/select-organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ organizationId: orgId }),
      });
      const session = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new ApiError(session?.message ?? 'No se pudo seleccionar la organización', res.status, session);
      }
      applySession(session);
    },
    platformLogin: async (credentials) => {
      // Un solo paso visible para el cliente: el BFF hace login + intercambio a token de plataforma
      const res = await fetch('/api/auth/platform-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });
      const session = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new ApiError(session?.message ?? 'Acceso de plataforma denegado', res.status, session);
      }
      applySession(session);
    },
    register: async (payload) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const session = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new ApiError(session?.message ?? 'No se pudo registrar', res.status, session);
      }
      applySession(session);
    },
    createOrganization: async (payload) => {
      if (!hasSession) throw new ApiError('La sesión ha expirado', 401);
      const organization = await apiFetch<{ id: string }>('/organizations', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await value.selectOrganization(organization.id);
    },
    logout: () => {
      clearLocal();
      void fetch('/api/auth/logout', { method: 'DELETE', credentials: 'include' }).catch(() => {});
    },
    hasOrgRole: (roles: string[]) => {
      if (!orgRole) return false;
      return roles.includes(orgRole);
    },
    refreshMemberships,
  }), [user, organizationId, orgRole, platformRole, memberships, isHydrated, hasSession, applySession, clearLocal, refreshMemberships, router]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
