/**
 * Cliente HTTP del navegador (Fase 2 - BFF).
 *
 * Todas las llamadas autenticadas pasan por /api/proxy/*, que añade el
 * `Authorization: Bearer` desde la cookie httpOnly en el servidor.
 * Ya NO existe un token global en memoria de JS (setAuthToken/getAuthToken fueron eliminados).
 */

export type ApiOptions = RequestInit & { organizationId?: string };

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Tipos actualizados según el JWT actual (organizationId, orgRole, platformRole)
export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  platformRole?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Membership = {
  id: string;
  userId?: string;
  organizationId: string;
  role: 'OWNER' | 'ADMIN' | 'VENDEDOR' | 'INVENTARIO' | 'CAJA';
  invitedAt?: string;
  invitedBy?: string;
  organization?: {
    id: string;
    name: string;
    businessTypeId: string;
    enabledModules?: string[];
    businessType?: {
      id: string;
      code: string;
      name: string;
      description?: string | null;
      defaultModules?: unknown;
      productSchema?: Record<string, unknown>
    };
  };
};

/**
 * Sesión devuelta por el BFF: NUNCA incluye accessToken ni ningún JWT.
 * Es lo que devuelve POST /api/auth/login y GET /api/auth/session.
 */
export type SessionResponse = {
  user: AuthUser | null;
  organizationId?: string | null;
  orgRole?: Membership['role'] | null;
  platformRole?: string | null;
  memberships?: Membership[];
};

/** @deprecated Alias histórico: ya no contiene accessToken (tarea 2.5). */
export type AuthResponse = SessionResponse;

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { organizationId, headers, ...init } = options;

  // El navegador llama SIEMPRE al proxy del BFF; el token se añade allí desde la cookie httpOnly
  const response = await fetch(`/api/proxy${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(organizationId ? { 'X-Org-Id': organizationId } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    // 401 con sesión previa => sesión expirada/rechazada: avisar para redirigir a login.
    // (Un 401 en /auth/login o /auth/register es credencial inválida, no sesión expirada.)
    const isAuthAttempt = path.startsWith('/auth/login') || path.startsWith('/auth/register');
    if (response.status === 401 && typeof window !== 'undefined' && !isAuthAttempt) {
      // Saber si el usuario era de plataforma sin ver el token: se consulta la sesión (sin token en JSON)
      let platformRole: string | null = null;
      try {
        const sessionRes = await fetch('/api/auth/session', { credentials: 'include', cache: 'no-store' });
        if (sessionRes.ok) {
          const session = await sessionRes.json();
          platformRole = session?.platformRole ?? null;
        }
      } catch {
        // sin datos: tratar como usuario normal
      }
      window.dispatchEvent(
        new CustomEvent('pymodular:session-expired', { detail: { platformRole } })
      );
    }

    let message = `La solicitud falló (${response.status})`;
    let errorData: unknown;

    try {
      errorData = await response.json();
      if (errorData && typeof errorData === 'object' && 'message' in errorData) {
        const msg = errorData.message;
        message = Array.isArray(msg) ? msg.join(', ') : (msg as string) || message;
      }
    } catch {
      // Algunas respuestas de error no tienen cuerpo JSON o no se pudo parsear
    }

    throw new ApiError(message, response.status, errorData);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
