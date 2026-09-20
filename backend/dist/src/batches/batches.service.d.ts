import { PrismaService } from '../prisma.service';
import { Batch, BatchStatus } from '@prisma/client';
interface CreateBatchDto {
    productId: string;
    batchNumber: string;
    serialNumber?: string;
    manufacturingDate?: Date;
    expirationDate?: Date;
    initialQuantity: number;
    unitCost: number;
    location?: string;
    organizationId: string;
}
interface UpdateBatchDto {
    status?: BatchStatus;
    location?: string;
    expirationDate?: Date;
}
export declare class BatchesService {
    private prisma;
    constructor(prisma: PrismaService);
    createBatch(dto: CreateBatchDto): Promise<Batch>;
    getBatches(organizationId: string, filters?: {
        productId?: string;
        status?: BatchStatus;
        expiringSoon?: boolean;
        daysThreshold?: number;
    }): Promise<Batch[]>;
    getBatchById(organizationId: string, id: string): Promise<Batch>;
    updateBatch(organizationId: string, id: string, dto: UpdateBatchDto): Promise<Batch>;
    retainBatch(organizationId: string, id: string, reason?: string): Promise<Batch>;
    releaseBatch(organizationId: string, id: string): Promise<Batch>;
    markAsExpired(organizationId: string, id: string): Promise<Batch>;
    getBatchStats(organizationId: string): Promise<any>;
}
export {};
