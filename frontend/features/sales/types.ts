/**
 * Fase 3 - tarea 3.2: tipos del dominio de ventas (extraídos de features/hooks/index.ts).
 */
export type SaleStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED';

export type SaleItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product?: { name: string; sku?: string | null };
};

export type Sale = {
  id: string;
  saleNumber: string;
  status: SaleStatus;
  total: number;
  saleDate: string;
  customerId?: string | null;
  customer?: { id: string; name: string } | null;
  items: SaleItem[];
};

export type CreateSalePayload = {
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  customerId?: string;
};
