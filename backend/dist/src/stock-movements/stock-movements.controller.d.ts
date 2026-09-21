import { StockMovementService } from './stock-movements.service';
export declare class StockMovementsController {
    private readonly stockMovementService;
    constructor(stockMovementService: StockMovementService);
    createMovement(req: any, dto: {
        productId: string;
        type: 'INGRESO' | 'SALIDA' | 'AJUSTE' | 'TRANSFERENCIA';
        reason: string;
        quantity: number;
        batchId?: string;
        referenceType?: string;
        referenceId?: string;
        notes?: string;
    }): Promise<StockMovement>;
    getMovements(req: any, productId?: string, type?: string, reason?: string, referenceType?: string, referenceId?: string): Promise<StockMovement[]>;
    getMovementById(req: any, id: string): Promise<StockMovement>;
    registerInitialStock(req: any, dto: {
        productId: string;
        quantity: number;
        unitCost: number;
        batchNumber?: string;
        expirationDate?: Date;
    }): Promise<{
        movement: StockMovement;
        batch?: Batch;
    }>;
}
