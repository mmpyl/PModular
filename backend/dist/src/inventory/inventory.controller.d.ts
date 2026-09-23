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
        lastCountedAt: Date | null;
        averageCost: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    getInventoryById(req: any, id: string): Promise<{
        id: string;
        organizationId: string;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        reserved: import("@prisma/client/runtime/library").Decimal;
        lastCountedAt: Date | null;
        averageCost: import("@prisma/client/runtime/library").Decimal;
    }>;
    updateInventory(req: any, id: string, dto: any): Promise<any>;
    recalculateInventory(req: any, productId: string): Promise<{
        id: string;
        organizationId: string;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        reserved: import("@prisma/client/runtime/library").Decimal;
        lastCountedAt: Date | null;
        averageCost: import("@prisma/client/runtime/library").Decimal;
    }>;
    getLowStock(req: any, threshold?: string): Promise<{
        id: string;
        organizationId: string;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        reserved: import("@prisma/client/runtime/library").Decimal;
        lastCountedAt: Date | null;
        averageCost: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    getExpiringBatches(req: any, days?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.BatchStatus;
        organizationId: string;
        productId: string;
        unitCost: import("@prisma/client/runtime/library").Decimal;
        batchNumber: string;
        expirationDate: Date | null;
        serialNumber: string | null;
        manufacturingDate: Date | null;
        initialQuantity: import("@prisma/client/runtime/library").Decimal;
        currentQuantity: import("@prisma/client/runtime/library").Decimal;
        location: string | null;
    }[]>;
}
