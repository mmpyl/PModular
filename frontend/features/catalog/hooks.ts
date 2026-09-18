'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export type Category = {
  id: string;
  name: string;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  _count?: { products: number };
};

export type Unit = {
  id: string;
  name: string;
  symbol?: string | null;
  isFractionable: boolean;
};

export type Product = {
  id: string;
  name: string;
  sku?: string | null;
  price: number | string;
  cost?: number | string | null;
  isActive: boolean;
  attributes?: Record<string, unknown>;
  category?: { id: string; name: string } | null;
  unit?: { id: string; name: string; symbol?: string | null } | null;
};

// Categories
export function useCategories(organizationId: string | undefined, token?: string) {
  return useQuery<Category[]>({
    queryKey: ['categories', organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<Category[]>('/categories', { organizationId, token });
    },
    enabled: !!organizationId,
  });
}

export function useCreateCategory(organizationId: string | undefined, token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; parentId: string | null }) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<Category>('/categories', {
        method: 'POST',
        organizationId,
        token,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory(organizationId: string | undefined, token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; parentId: string | null } }) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<Category>(`/categories/${id}`, {
        method: 'PATCH',
        organizationId,
        token,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory(organizationId: string | undefined, token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<void>(`/categories/${id}`, {
        method: 'DELETE',
        organizationId,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// Units
export function useUnits(organizationId: string | undefined, token?: string) {
  return useQuery<Unit[]>({
    queryKey: ['units', organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<Unit[]>('/units-of-measure', { organizationId, token });
    },
    enabled: !!organizationId,
  });
}

export function useCreateUnit(organizationId: string | undefined, token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; symbol?: string; isFractionable: boolean }) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<Unit>('/units-of-measure', {
        method: 'POST',
        organizationId,
        token,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
}

export function useUpdateUnit(organizationId: string | undefined, token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; symbol?: string; isFractionable: boolean } }) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<Unit>(`/units-of-measure/${id}`, {
        method: 'PATCH',
        organizationId,
        token,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
}

export function useDeleteUnit(organizationId: string | undefined, token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<void>(`/units-of-measure/${id}`, {
        method: 'DELETE',
        organizationId,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
}

// Products
export function useProducts(organizationId: string | undefined, search?: string, categoryId?: string, token?: string) {
  return useQuery<Product[]>({
    queryKey: ['products', organizationId, search, categoryId],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required');
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryId) params.set('categoryId', categoryId);
      const qs = params.toString();
      return apiFetch<Product[]>(`/products${qs ? `?${qs}` : ''}`, { organizationId, token });
    },
    enabled: !!organizationId,
  });
}

export function useCreateProduct(organizationId: string | undefined, token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      sku?: string;
      price: number;
      cost?: number;
      categoryId: string | null;
      unitId: string | null;
      attributes?: Record<string, unknown>;
    }) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<Product>('/products', {
        method: 'POST',
        organizationId,
        token,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct(organizationId: string | undefined, token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: {
      name: string;
      sku?: string;
      price: number;
      cost?: number;
      categoryId: string | null;
      unitId: string | null;
      attributes?: Record<string, unknown>;
    }}) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<Product>(`/products/${id}`, {
        method: 'PATCH',
        organizationId,
        token,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct(organizationId: string | undefined, token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<void>(`/products/${id}`, {
        method: 'DELETE',
        organizationId,
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
