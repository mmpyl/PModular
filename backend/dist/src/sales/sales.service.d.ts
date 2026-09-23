import { PrismaService } from '../prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { StockMovementService } from '../stock-movements/stock-movements.service';
import { CreateSaleDto, UpdateSaleDto, ProcessPaymentDto, SaleStatus } from './dto/create-sale.dto';
export declare class SalesService {
    private prisma;
    private inventoryService;
    private stockMovementService;
    constructor(prisma: PrismaService, inventoryService: InventoryService, stockMovementService: StockMovementService);
    create(organizationId: string, userId: string, dto: CreateSaleDto): Promise<any>;
    findAll(organizationId: string, status?: SaleStatus, customerId?: string): Promise<any>;
    findOne(organizationId: string, id: string): Promise<any>;
    update(organizationId: string, id: string, dto: UpdateSaleDto): Promise<any>;
    complete(organizationId: string, userId: string, id: string): Promise<any>;
    processPayment(organizationId: string, userId: string, saleId: string, dto: ProcessPaymentDto): Promise<{
        payment: any;
        sale: any;
    }>;
    cancel(organizationId: string, id: string): Promise<any>;
    remove(organizationId: string, id: string): Promise<any>;
    private generateSaleNumberInTransaction;
    private generateSaleNumber;
}
