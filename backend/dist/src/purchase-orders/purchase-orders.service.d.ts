import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { StockMovementService } from '../stock-movements/stock-movements.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto, ReceivePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrderStatus } from '@prisma/client';
export declare class PurchaseOrdersService {
    private prisma;
    private inventoryService;
    private stockMovementService;
    constructor(prisma: PrismaService, inventoryService: InventoryService, stockMovementService: StockMovementService);
    create(organizationId: string, userId: string, dto: CreatePurchaseOrderDto): Promise<any>;
    findAll(organizationId: string, status?: PurchaseOrderStatus, supplierId?: string): Promise<any>;
    findOne(organizationId: string, id: string): Promise<any>;
    update(organizationId: string, id: string, dto: UpdatePurchaseOrderDto): Promise<any>;
    receive(organizationId: string, userId: string, orderId: string, dto: ReceivePurchaseOrderDto): Promise<any>;
    cancel(organizationId: string, id: string): Promise<any>;
    remove(organizationId: string, id: string): Promise<any>;
    private generateOrderNumberInTransaction;
    private generateOrderNumber;
}
