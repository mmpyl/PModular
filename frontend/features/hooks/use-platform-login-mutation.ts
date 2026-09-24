'use client';

import { useMutation } from '@tanstack/react-query';
import { ApiError, type SessionResponse } from '@/lib/api';

/**
 * Login de plataforma vía BFF (POST /api/auth/platform-login).
 * El BFF hace el doble paso (login + intercambio a token de plataforma) en servidor;
 * el cliente solo recibe la sesión segura, sin tokens.
 */
export function usePlatformLoginMutation() {
  return useMutation<SessionResponse, Error, { email: string; password: string }>({
    mutationFn: async (credentials) => {
      const res = await fetch('/api/auth/platform-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });
      const data = (await res.json().catch(() => ({}))) as SessionResponse & { message?: string };
      if (!res.ok) {
        throw new ApiError(data?.message ?? 'Acceso de plataforma denegado', res.status, data);
      }
      return data;
    },
  });
}
