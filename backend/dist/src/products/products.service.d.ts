import { PrismaService } from '../prisma.service';
export interface CreateProductDto {
    name: string;
    sku?: string;
    description?: string;
    price: number;
    cost?: number;
    categoryId?: string;
    unitId?: string;
    attributes?: Record<string, any>;
    isActive?: boolean;
}
export declare class ProductsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(organizationId: string, data: CreateProductDto): Promise<any>;
    findAll(organizationId: string, options?: {
        categoryId?: string;
        search?: string;
    }): any;
    findOne(organizationId: string, id: string): any;
    update(organizationId: string, id: string, data: Partial<CreateProductDto>): Promise<any>;
    remove(organizationId: string, id: string): Promise<any>;
}
