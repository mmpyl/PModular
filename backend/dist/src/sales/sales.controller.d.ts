import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto, ProcessPaymentDto, SaleStatus } from './dto/create-sale.dto';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    create(dto: CreateSaleDto, orgId: string, user: any): Promise<any>;
    findAll(orgId: string, status?: SaleStatus, customerId?: string): Promise<any>;
    findOne(id: string, orgId: string): Promise<any>;
    update(id: string, dto: UpdateSaleDto, orgId: string): Promise<any>;
    complete(id: string, orgId: string, user: any): Promise<any>;
    processPayment(id: string, dto: ProcessPaymentDto, orgId: string, user: any): Promise<{
        payment: any;
        sale: any;
    }>;
    cancel(id: string, orgId: string): Promise<any>;
    remove(id: string, orgId: string): Promise<any>;
}
