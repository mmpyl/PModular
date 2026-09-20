import { PrismaService } from '../prisma.service';
import { Batch, StockMovement, MovementType, MovementReason, InventoryItem } from '@prisma/client';
interface CreateStockMovementDto {
    productId: string;
    type: MovementType;
    reason: MovementReason;
    quantity: number;
    batchId?: string;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
    organizationId: string;
    performedBy: string;
}
interface StockAdjustmentResult {
    movement: StockMovement;
    inventoryItem: InventoryItem;
    batch: Batch | null;
}
interface AdjustStockOptions {
    batchId?: string | null;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
    unitCost?: number;
    batchNumber?: string;
    expirationDate?: Date;
}
export declare class StockMovementService {
    private prisma;
    constructor(prisma: PrismaService);
    adjustStock(productId: string, organizationId: string, quantityDelta: number, reason: MovementReason, performedBy: string, options?: AdjustStockOptions): Promise<StockAdjustmentResult>;
    adjustStockInTransaction(tx: any, productId: string, organizationId: string, quantityDelta: number, reason: MovementReason, performedBy: string, options?: AdjustStockOptions): Promise<StockAdjustmentResult>;
    createStockMovement(dto: CreateStockMovementDto): Promise<StockMovement>;
    getMovements(organizationId: string, filters?: {
        productId?: string;
        type?: string;
        reason?: string;
        referenceType?: string;
        referenceId?: string;
    }): Promise<StockMovement[]>;
    getMovementById(organizationId: string, id: string): Promise<StockMovement>;
    private recalculateInventoryInTransaction;
    recalculateInventory(productId: string, organizationId: string): Promise<InventoryItem>;
    registerInitialStock(productId: string, organizationId: string, quantity: number, unitCost: number, batchNumber?: string, expirationDate?: Date, performedBy?: string): Promise<{
        movement: StockMovement;
        batch?: Batch;
    }>;
}
export {};
