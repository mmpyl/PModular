import { InventoryService } from './inventory.service';
import { StockMovementService } from '../stock-movements/stock-movements.service';
export declare class InventoryController {
    private readonly inventoryService;
    private readonly stockMovementService;
    constructor(inventoryService: InventoryService, stockMovementService: StockMovementService);
    getInventory(req: any, productId?: string): Promise<{
        id: string;
        organizationId: string;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        reserved: import("@prisma/client/runtime/library").Decimal;
        averageCost: import("@prisma/client/runtime/library").Decimal;
        lastCountedAt: Date | null;
    }[]>;
    getInventoryById(req: any, id: string): Promise<{
        id: string;
        organizationId: string;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        reserved: import("@prisma/client/runtime/library").Decimal;
        averageCost: import("@prisma/client/runtime/library").Decimal;
        lastCountedAt: Date | null;
    }>;
    updateInventory(req: any, id: string, dto: any): Promise<any>;
    recalculateInventory(req: any, productId: string): Promise<{
        id: string;
        organizationId: string;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        reserved: import("@prisma/client/runtime/library").Decimal;
        averageCost: import("@prisma/client/runtime/library").Decimal;
        lastCountedAt: Date | null;
    }>;
    getLowStock(req: any, threshold?: string): Promise<{
        id: string;
        organizationId: string;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        reserved: import("@prisma/client/runtime/library").Decimal;
        averageCost: import("@prisma/client/runtime/library").Decimal;
        lastCountedAt: Date | null;
    }[]>;
    getExpiringBatches(req: any, days?: string): Promise<{
        currentQuantity: import("@prisma/client/runtime/library").Decimal;
        batchNumber: string;
        expirationDate: Date | null;
        id: string;
        organizationId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.BatchStatus;
        productId: string;
        serialNumber: string | null;
        manufacturingDate: Date | null;
        initialQuantity: import("@prisma/client/runtime/library").Decimal;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        location: string | null;
    }[]>;
}
