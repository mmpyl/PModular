const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type ApiOptions = RequestInit & { token?: string; organizationId?: string };

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, organizationId, headers, ...init } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(organizationId ? { 'X-Org-Id': organizationId } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pymodular:session-expired'));
    }
    let message = `La solicitud fallo (${response.status})`;
    try {
      const error = (await response.json()) as { message?: string | string[] };
      message = Array.isArray(error.message) ? error.message.join(', ') : error.message || message;
    } catch {
      // Algunas respuestas de error no tienen cuerpo JSON.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  platformRole: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Membership = {
  id: string;
  organizationId: string;
  role: 'OWNER' | 'ADMIN' | 'VENDEDOR' | 'INVENTARIO' | 'CAJA';
  organization: {
    id: string;
    name: string;
    enabledModules?: unknown;
    businessType?: { name: string; defaultModules?: unknown; productSchema?: Record<string, unknown> };
  };
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
  organizationId?: string;
  orgRole?: Membership['role'];
  platformRole?: string;
  memberships?: Membership[];
};
