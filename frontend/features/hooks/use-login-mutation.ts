'use client';

import { useMutation } from '@tanstack/react-query';
import { apiFetch, AuthResponse } from '@/lib/api';

export function useLoginMutation() {
  return useMutation<AuthResponse, Error, { email: string; password: string }>({
    mutationFn: async (credentials) => {
      return apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },
  });
}
