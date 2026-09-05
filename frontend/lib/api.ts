const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type ApiOptions = RequestInit & { token?: string };

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
  const { token, headers, ...init } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
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
  }

  return response.json() as Promise<T>;
}
