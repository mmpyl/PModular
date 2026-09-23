import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto, ReceivePurchaseOrderDto, PurchaseOrderStatus } from './dto/create-purchase-order.dto';
export declare class PurchaseOrdersController {
    private readonly purchaseOrdersService;
    constructor(purchaseOrdersService: PurchaseOrdersService);
    create(dto: CreatePurchaseOrderDto, orgId: string, user: any): Promise<any>;
    findAll(orgId: string, status?: PurchaseOrderStatus, supplierId?: string): Promise<any>;
    findOne(id: string, orgId: string): Promise<any>;
    update(id: string, dto: UpdatePurchaseOrderDto, orgId: string): Promise<any>;
    receive(id: string, dto: ReceivePurchaseOrderDto, orgId: string, user: any): Promise<any>;
    cancel(id: string, orgId: string): Promise<any>;
    remove(id: string, orgId: string): Promise<any>;
}
