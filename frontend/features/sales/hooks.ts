/**
 * Fase 3 - tarea 3.2: api + hooks react-query del dominio de ventas.
 * (Dividido desde features/hooks/index.ts; usa queryKeys centralizados.)
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Sale, SaleStatus, CreateSalePayload } from './types';

export * from './types';

export function useSales(organizationId: string | undefined, status?: SaleStatus, customerId?: string) {
  return useQuery<Sale[]>({
    queryKey: queryKeys.sales.list(organizationId, status),
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required');
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (customerId) params.set('customerId', customerId);
      const qs = params.toString();
      return apiFetch<Sale[]>(`/sales${qs ? `?${qs}` : ''}`, { organizationId });
    },
    enabled: !!organizationId,
  });
}

export function useCreateSale(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSalePayload) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<Sale>('/sales', {
        method: 'POST',
        organizationId,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
    },
  });
}

export function useCompleteSale(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (saleId: string) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<Sale>(`/sales/${saleId}/complete`, {
        method: 'POST',
        organizationId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all });
    },
  });
}

export function useCancelSale(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (saleId: string) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<Sale>(`/sales/${saleId}/cancel`, {
        method: 'POST',
        organizationId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
    },
  });
}
