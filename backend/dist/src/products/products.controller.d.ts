import { ProductsService } from './products.service';
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
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(createProductDto: CreateProductDto, organizationId: string): Promise<any>;
    findAll(organizationId: string, categoryId?: string, search?: string): any;
    findOne(id: string, organizationId: string): any;
    remove(id: string, organizationId: string): Promise<any>;
}
