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

// Tipos actualizados según el JWT actual (organizationId, orgRole, platformRole)
export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  platformRole?: string;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
  organizationId?: string;
  orgRole?: string;
  platformRole?: string;
  memberships?: Membership[];
};

export type Membership = {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  invitedAt: string;
  invitedBy: string;
  organization?: {
    id: string;
    name: string;
    businessTypeId: string;
  };
};

// Error personalizado para manejar errores de API
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
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
<<<<<<< HEAD
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
=======
    let errorMessage = `API request failed with status ${response.status}`;
    let errorData: unknown;

    try {
      errorData = await response.json();
      if (errorData && typeof errorData === 'object' && 'message' in errorData) {
        errorMessage = String(errorData.message);
      }
    } catch {
      // No es JSON o no se pudo parsear
    }

    throw new ApiError(response.status, errorMessage, errorData);
>>>>>>> 8f7b97ccc2e38d7b74af818d2a0a76d13f3dfb52
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
<<<<<<< HEAD

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
=======
>>>>>>> 8f7b97ccc2e38d7b74af818d2a0a76d13f3dfb52
