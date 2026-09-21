import { InventoryService } from './inventory.service';
import { StockMovementService } from '../stock-movements/stock-movements.service';
export declare class InventoryController {
    private readonly inventoryService;
    private readonly stockMovementService;
    constructor(inventoryService: InventoryService, stockMovementService: StockMovementService);
    getInventory(req: any, productId?: string): Promise<InventoryItem[]>;
    getInventoryById(req: any, id: string): Promise<InventoryItem>;
    updateInventory(req: any, id: string, dto: any): Promise<any>;
    recalculateInventory(req: any, productId: string): Promise<InventoryItem>;
    getLowStock(req: any, threshold?: string): Promise<InventoryItem[]>;
    getExpiringBatches(req: any, days?: string): Promise<Batch[]>;
}
