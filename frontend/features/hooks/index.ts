'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, Membership } from '@/lib/api';

// ==================== MEMBERSHIPS ====================

export type MemberWithUser = Membership & {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

export function useMemberships(organizationId: string | undefined) {
  return useQuery<MemberWithUser[]>({
    queryKey: ['memberships', organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<MemberWithUser[]>(`/memberships/organization/${organizationId}`, { organizationId });
    },
    enabled: !!organizationId,
  });
}

export function useUpdateMemberRole(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'OWNER' | 'ADMIN' | 'VENDEDOR' | 'INVENTARIO' | 'CAJA' }) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<Membership>(`/memberships/${userId}/${organizationId}`, {
        method: 'PATCH',
        organizationId,
        body: JSON.stringify({ role }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
    },
  });
}

export function useRemoveMember(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<void>(`/memberships/${userId}/${organizationId}`, {
        method: 'DELETE',
        organizationId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
    },
  });
}

export function useInviteMember(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: 'OWNER' | 'ADMIN' | 'VENDEDOR' | 'INVENTARIO' | 'CAJA' }) => {
      if (!organizationId) throw new Error('Organization ID required');
      // El backend POST /memberships requiere userId, no email
      // Necesitamos encontrar el usuario por email primero
      // Usamos el endpoint de plataforma que permite buscar usuarios
      const platformUsers = await apiFetch<{ data: Array<{ id: string; email: string; name?: string }> }>(
        '/platform/users?email=' + encodeURIComponent(email),
        {}
      );
      const user = platformUsers.data?.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        throw new Error('El usuario no está registrado en la plataforma. Pídele que se registre primero.');
      }
      // Verificamos que no sea ya miembro
      const members = await apiFetch<Array<{ id: string; user: { id: string; email: string } }>>(
        `/memberships/organization/${organizationId}`,
        { organizationId }
      );
      const existingMember = members.find(m => m.user.id === user.id);
      if (existingMember) {
        throw new Error('El usuario ya es miembro de esta organización');
      }
      // Creamos la membresía
      return apiFetch<Membership>('/memberships', {
        method: 'POST',
        organizationId,
        body: JSON.stringify({ userId: user.id, organizationId, role }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
    },
  });
}

// ==================== INVENTORY ====================

export type InventoryItem = {
  id: string;
  productId: string;
  quantity: number;
  reserved: number;
  averageCost: number;
  product: {
    id: string;
    name: string;
    sku?: string | null;
  };
};

export function useInventory(organizationId: string | undefined, productId?: string) {
  return useQuery<InventoryItem[]>({
    queryKey: ['inventory', organizationId, productId],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required');
      const params = new URLSearchParams();
      if (productId) params.set('productId', productId);
      const qs = params.toString();
      return apiFetch<InventoryItem[]>(`/inventory${qs ? `?${qs}` : ''}`, { organizationId });
    },
    enabled: !!organizationId,
  });
}

export function useUpdateInventory(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { quantity?: number; reserved?: number; averageCost?: number } }) => {
      if (!organizationId) throw new Error('Organization ID required');
      const params = new URLSearchParams();
      if (data.quantity !== undefined) params.set('quantity', String(data.quantity));
      if (data.reserved !== undefined) params.set('reserved', String(data.reserved));
      if (data.averageCost !== undefined) params.set('averageCost', String(data.averageCost));
      return apiFetch<InventoryItem>(`/inventory/${id}?${params.toString()}`, {
        method: 'PATCH',
        organizationId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useRecalculateInventory(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<void>(`/inventory/recalculate/${productId}`, {
        method: 'POST',
        organizationId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

// ==================== SALES ====================

export type SaleStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED';

export type Sale = {
  id: string;
  saleNumber: string;
  status: SaleStatus;
  total: number;
  saleDate: string;
  customerId?: string | null;
  customer?: { id: string; name: string } | null;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    product?: { name: string; sku?: string | null };
  }>;
};

export function useSales(organizationId: string | undefined, status?: SaleStatus, customerId?: string) {
  return useQuery<Sale[]>({
    queryKey: ['sales', organizationId, status, customerId],
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
    mutationFn: async (data: {
      items: Array<{ productId: string; quantity: number; unitPrice: number }>;
      customerId?: string;
    }) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<Sale>('/sales', {
        method: 'POST',
        organizationId,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
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
      queryClient.invalidateQueries({ queryKey: ['sales'] });
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
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

// ==================== PURCHASE ORDERS ====================

export type PurchaseOrderStatus = 'DRAFT' | 'PENDING' | 'RECEIVED' | 'CANCELLED';

export type PurchaseOrder = {
  id: string;
  orderNumber: string;
  status: PurchaseOrderStatus;
  total: number;
  orderDate: string;
  supplierId: string;
  supplier?: { id: string; name: string } | null;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitCost: number;
    subtotal: number;
    product?: { name: string; sku?: string | null };
  }>;
};

export function usePurchaseOrders(organizationId: string | undefined, status?: PurchaseOrderStatus, supplierId?: string) {
  return useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders', organizationId, status, supplierId],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required');
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (supplierId) params.set('supplierId', supplierId);
      const qs = params.toString();
      return apiFetch<PurchaseOrder[]>(`/purchase-orders${qs ? `?${qs}` : ''}`, { organizationId });
    },
    enabled: !!organizationId,
  });
}

export function useCreatePurchaseOrder(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      supplierId: string;
      items?: Array<{ productId: string; quantity: number; unitCost: number }>;
    }) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<PurchaseOrder>('/purchase-orders', {
        method: 'POST',
        organizationId,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

export function useReceivePurchaseOrder(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: { items?: Array<{ productId: string; quantityReceived: number }> } }) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<PurchaseOrder>(`/purchase-orders/${orderId}/receive`, {
        method: 'POST',
        organizationId,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useCancelPurchaseOrder(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<PurchaseOrder>(`/purchase-orders/${orderId}/cancel`, {
        method: 'POST',
        organizationId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

// ==================== CASH REGISTERS ====================

export type CashRegisterStatus = 'OPEN' | 'CLOSED' | 'ACTIVE';

export type CashRegister = {
  id: string;
  name: string;
  description?: string | null;
  status: CashRegisterStatus;
  currentBalance?: number;
  openedAt?: string | null;
  closedAt?: string | null;
};

export type CashRegisterMovement = {
  id: string;
  registerId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  reason: string;
  createdAt: string;
  createdBy?: { id: string; name: string | null } | null;
};

export function useCashRegisters(organizationId: string | undefined) {
  return useQuery<CashRegister[]>({
    queryKey: ['cash-registers', organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<CashRegister[]>('/cash-registers', { organizationId });
    },
    enabled: !!organizationId,
  });
}

export function useCreateCashRegister(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<CashRegister>('/cash-registers', {
        method: 'POST',
        organizationId,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
    },
  });
}

export function useOpenCashRegister(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ registerId, initialBalance }: { registerId: string; initialBalance: number }) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<CashRegister>(`/cash-registers/${registerId}/open`, {
        method: 'POST',
        organizationId,
        body: JSON.stringify({ initialBalance }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
    },
  });
}

export function useCloseCashRegister(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ registerId, finalBalance }: { registerId: string; finalBalance: number }) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<CashRegister>(`/cash-registers/${registerId}/close`, {
        method: 'POST',
        organizationId,
        body: JSON.stringify({ finalBalance }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
    },
  });
}

export function useAddCashRegisterMovement(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ registerId, data }: { registerId: string; data: { amount: number; type: 'INCOME' | 'EXPENSE'; reason: string } }) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<CashRegisterMovement>(`/cash-registers/${registerId}/movements`, {
        method: 'POST',
        organizationId,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
    },
  });
}

export function useCashRegisterMovements(organizationId: string | undefined, registerId: string | undefined) {
  return useQuery<CashRegisterMovement[]>({
    queryKey: ['cash-register-movements', registerId],
    queryFn: async () => {
      if (!organizationId || !registerId) throw new Error('Organization ID and Register ID required');
      return apiFetch<CashRegisterMovement[]>(`/cash-registers/${registerId}/movements`, { organizationId });
    },
    enabled: !!organizationId && !!registerId,
  });
}

// ==================== PRODUCTS ====================

export type Product = {
  id: string;
  name: string;
  sku?: string | null;
  price: number;
  description?: string | null;
};

export function useProducts(organizationId: string | undefined) {
  return useQuery<Product[]>({
    queryKey: ['products', organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<Product[]>('/products', { organizationId });
    },
    enabled: !!organizationId,
  });
}

// ==================== BUSINESS ENTITIES ====================

export type BusinessEntityType = 'PROVEEDOR' | 'CLIENTE' | 'AMBOS';

export type BusinessEntity = {
  id: string;
  name: string;
  entityType: BusinessEntityType;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  creditLimit?: number | null;
  currentBalance?: number | null;
};

export type BusinessEntityWithHistory = BusinessEntity & {
  purchaseOrders?: Array<{
    id: string;
    orderNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
  sales?: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
  totalPurchases?: number;
  totalSales?: number;
  calculatedBalance?: number;
};

export function useBusinessEntities(organizationId: string | undefined, type?: BusinessEntityType, search?: string) {
  return useQuery<BusinessEntity[]>({
    queryKey: ['business-entities', organizationId, type, search],
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required');
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      if (search) params.set('search', search);
      const qs = params.toString();
      return apiFetch<BusinessEntity[]>(`/business-entities${qs ? `?${qs}` : ''}`, { organizationId });
    },
    enabled: !!organizationId,
  });
}

export function useCreateBusinessEntity(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      entityType: BusinessEntityType;
      taxId?: string;
      email?: string;
      phone?: string;
      mobile?: string;
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      notes?: string;
      creditLimit?: number;
    }) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<BusinessEntity>('/business-entities', {
        method: 'POST',
        organizationId,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-entities'] });
    },
  });
}

export function useUpdateBusinessEntity(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BusinessEntity> }) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<BusinessEntity>(`/business-entities/${id}`, {
        method: 'PATCH',
        organizationId,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-entities'] });
    },
  });
}

export function useDeleteBusinessEntity(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!organizationId) throw new Error('Organization ID required');
      return apiFetch<void>(`/business-entities/${id}`, {
        method: 'DELETE',
        organizationId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-entities'] });
    },
  });
}

export function useBusinessEntityWithHistory(organizationId: string | undefined, id: string | undefined) {
  return useQuery<BusinessEntityWithHistory>({
    queryKey: ['business-entity-history', organizationId, id],
    queryFn: async () => {
      if (!organizationId || !id) throw new Error('Organization ID and Entity ID required');
      return apiFetch<BusinessEntityWithHistory>(`/business-entities/${id}/history`, { organizationId });
    },
    enabled: !!organizationId && !!id,
  });
}
