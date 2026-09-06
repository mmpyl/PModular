const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type ApiOptions = RequestInit & { token?: string; organizationId?: string };

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

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
  organizationId?: string;
  orgRole?: Membership['role'];
  platformRole?: string | null;
  memberships?: Membership[];
};

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
    // Manejar expiración de sesión (401)
    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pymodular:session-expired'));
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
