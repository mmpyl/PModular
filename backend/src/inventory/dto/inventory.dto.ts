import { MovementType, AdjustmentStatus } from '@prisma/client';

// ==========================================
// Warehouse DTOs
// ==========================================

export interface CreateWarehouseDto {
  name: string;
  code?: string;
  address?: string;
  isDefault?: boolean;
}

export interface UpdateWarehouseDto {
  name?: string;
  code?: string;
  address?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface WarehouseResponse {
  id: string;
  organizationId: string;
  name: string;
  code: string | null;
  address: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// Stock Item DTOs
// ==========================================

export interface StockItemResponse {
  id: string;
  organizationId: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reserved: number;
  productName?: string;
  productSku?: string;
  warehouseName?: string;
}

export interface StockSummaryByProduct {
  productId: string;
  productName: string;
  productSku: string | null;
  totalQuantity: number;
  totalReserved: number;
  stockByWarehouse: {
    warehouseId: string;
    warehouseName: string;
    quantity: number;
    reserved: number;
  }[];
}

export interface InventorySummary {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  items: {
    productId: string;
    productName: string;
    sku: string | null;
    totalQuantity: number;
    cost: number | null;
    totalValue: number;
  }[];
}

// ==========================================
// Stock Movement DTOs
// ==========================================

export interface CreateMovementDto {
  productId: string;
  warehouseId: string;
  movementType: MovementType;
  quantity: number;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
}

export interface StockMovementResponse {
  id: string;
  organizationId: string;
  productId: string;
  warehouseId: string;
  movementType: MovementType;
  quantity: number;
  balanceAfter: number;
  referenceId: string | null;
  referenceType: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  productName?: string;
  warehouseName?: string;
}

export interface MovementFilterDto {
  productId?: string;
  warehouseId?: string;
  movementType?: MovementType;
  startDate?: Date;
  endDate?: Date;
  referenceId?: string;
}

// ==========================================
// Stock Adjustment DTOs
// ==========================================

export interface StockAdjustmentItemDto {
  productId: string;
  expectedQuantity: number;
  countedQuantity: number;
}

export interface CreateAdjustmentDto {
  warehouseId: string;
  reason: string;
  notes?: string;
  items: StockAdjustmentItemDto[];
}

export interface ApproveAdjustmentDto {
  adjustmentId: string;
}

export interface RejectAdjustmentDto {
  adjustmentId: string;
  rejectionReason?: string;
}

export interface StockAdjustmentResponse {
  id: string;
  organizationId: string;
  warehouseId: string;
  status: AdjustmentStatus;
  reason: string;
  notes: string | null;
  requestedBy: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: StockAdjustmentItemResponse[];
}

export interface StockAdjustmentItemResponse {
  id: string;
  adjustmentId: string;
  productId: string;
  expectedQuantity: number;
  countedQuantity: number;
  difference: number;
  productName?: string;
  productSku?: string;
}

export interface AdjustmentFilterDto {
  warehouseId?: string;
  status?: AdjustmentStatus;
  startDate?: Date;
  endDate?: Date;
}
