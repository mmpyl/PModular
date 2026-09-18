'use client';

import { useMutation } from '@tanstack/react-query';
import { apiFetch, AuthResponse } from '@/lib/api';

export function usePlatformLoginMutation() {
  return useMutation<AuthResponse, Error, { email: string; password: string }>({
    mutationFn: async (credentials) => {
      // Primero hacemos login normal para obtener el token
      const loginResponse = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      // Luego usamos ese token para hacer el platform login
      return apiFetch<AuthResponse>('/auth/platform/login', {
        method: 'POST',
        token: loginResponse.accessToken,
      });
    },
  });
}
