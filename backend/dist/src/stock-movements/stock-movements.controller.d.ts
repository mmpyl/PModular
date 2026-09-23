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
    }): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MovementType;
        organizationId: string;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        isPositive: boolean;
        performedBy: string;
        batchId: string | null;
        reason: import(".prisma/client").$Enums.MovementReason;
        referenceType: string | null;
        referenceId: string | null;
    }>;
    getMovements(req: any, productId?: string, type?: string, reason?: string, referenceType?: string, referenceId?: string): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MovementType;
        organizationId: string;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        isPositive: boolean;
        performedBy: string;
        batchId: string | null;
        reason: import(".prisma/client").$Enums.MovementReason;
        referenceType: string | null;
        referenceId: string | null;
    }[]>;
    getMovementById(req: any, id: string): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.MovementType;
        organizationId: string;
        productId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        isPositive: boolean;
        performedBy: string;
        batchId: string | null;
        reason: import(".prisma/client").$Enums.MovementReason;
        referenceType: string | null;
        referenceId: string | null;
    }>;
    registerInitialStock(req: any, dto: {
        productId: string;
        quantity: number;
        unitCost: number;
        batchNumber?: string;
        expirationDate?: Date;
    }): Promise<{
        movement: import(".prisma/client").StockMovement;
        batch?: import(".prisma/client").Batch;
    }>;
}
