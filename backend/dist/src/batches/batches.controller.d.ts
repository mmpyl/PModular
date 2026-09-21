import { BatchesService } from './batches.service';
import { BatchStatus } from '@prisma/client';
export declare class BatchesController {
    private readonly batchesService;
    constructor(batchesService: BatchesService);
    createBatch(req: any, dto: {
        productId: string;
        batchNumber: string;
        serialNumber?: string;
        manufacturingDate?: Date;
        expirationDate?: Date;
        initialQuantity: number;
        unitCost: number;
        location?: string;
    }): Promise<Batch>;
    getBatches(req: any, productId?: string, status?: BatchStatus, expiringSoon?: string, days?: string): Promise<Batch[]>;
    getBatchById(req: any, id: string): Promise<Batch>;
    updateBatch(req: any, id: string, dto: {
        status?: BatchStatus;
        location?: string;
        expirationDate?: Date;
    }): Promise<Batch>;
    retainBatch(req: any, id: string, body: {
        reason?: string;
    }): Promise<Batch>;
    releaseBatch(req: any, id: string): Promise<Batch>;
    markAsExpired(req: any, id: string): Promise<Batch>;
    getBatchStats(req: any): Promise<any>;
}
