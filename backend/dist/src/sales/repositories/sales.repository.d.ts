import { PrismaService } from '../../prisma.service';
import { Sale } from '@prisma/client';
import { CreateSaleDto, UpdateSaleDto } from '../dto/create-sale.dto';
export declare class SalesRepository {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(organizationId: string): Promise<Sale[]>;
    findOne(id: string, organizationId: string): Promise<Sale | null>;
    create(data: CreateSaleDto, userId: string, organizationId: string): Promise<Sale>;
    update(id: string, data: UpdateSaleDto, organizationId: string): Promise<Sale>;
    complete(id: string, payments: {
        method: string;
        amount: number;
        reference?: string;
        notes?: string;
    }[], userId: string, organizationId: string): Promise<Sale>;
    cancel(id: string, organizationId: string): Promise<Sale>;
    delete(id: string, organizationId: string): Promise<Sale>;
}
