import { PrismaService } from '../prisma.service';
import { InventoryItem, Batch, MovementReason } from '@prisma/client';
interface UpdateInventoryDto {
    quantity?: number;
    reserved?: number;
    averageCost?: number;
    lastCountedAt?: Date;
}
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    getInventory(organizationId: string, productId?: string): Promise<InventoryItem[]>;
    getInventoryById(organizationId: string, id: string): Promise<InventoryItem>;
    ensureInventoryItem(productId: string, organizationId: string): Promise<InventoryItem>;
    updateInventory(organizationId: string, id: string, dto: UpdateInventoryDto): Promise<any>;
    recalculateInventory(productId: string, organizationId: string): Promise<InventoryItem>;
    getLowStockItems(organizationId: string, threshold?: number): Promise<InventoryItem[]>;
    getExpiringBatches(organizationId: string, daysThreshold?: number): Promise<Batch[]>;
    adjustStock(organizationId: string, productId: string, quantityDelta: number, reason: MovementReason, performedBy: string, notes?: string, batchId?: string | null): Promise<InventoryItem>;
}
export {};
