'use client';

import { useMutation } from '@tanstack/react-query';
import { ApiError, type SessionResponse } from '@/lib/api';

/**
 * Login vía BFF (POST /api/auth/login). La respuesta es la sesión segura:
 * user, rol y memberships — nunca el token.
 */
export function useLoginMutation() {
  return useMutation<SessionResponse, Error, { email: string; password: string }>({
    mutationFn: async (credentials) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });
      const data = (await res.json().catch(() => ({}))) as SessionResponse & { message?: string };
      if (!res.ok) {
        throw new ApiError(data?.message ?? 'No se pudo iniciar sesión', res.status, data);
      }
      return data;
    },
  });
}
