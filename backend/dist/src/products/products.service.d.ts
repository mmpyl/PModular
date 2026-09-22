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
    lowStockThreshold?: number;
    isActive?: boolean;
}
export declare class ProductsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(organizationId: string, data: CreateProductDto): Promise<{
        category: {
            id: string;
            organizationId: string;
            name: string;
            parentId: string | null;
        } | null;
        unit: {
            symbol: string | null;
            id: string;
            organizationId: string;
            name: string;
            isFractionable: boolean;
        } | null;
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        description: string | null;
        sku: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        categoryId: string | null;
        unitId: string | null;
        attributes: import("@prisma/client/runtime/library").JsonValue;
        lowStockThreshold: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
    }>;
    findAll(organizationId: string, options?: {
        categoryId?: string;
        search?: string;
    }): import(".prisma/client").Prisma.PrismaPromise<({
        category: {
            id: string;
            organizationId: string;
            name: string;
            parentId: string | null;
        } | null;
        unit: {
            symbol: string | null;
            id: string;
            organizationId: string;
            name: string;
            isFractionable: boolean;
        } | null;
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        description: string | null;
        sku: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        categoryId: string | null;
        unitId: string | null;
        attributes: import("@prisma/client/runtime/library").JsonValue;
        lowStockThreshold: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
    })[]>;
    findOne(organizationId: string, id: string): import(".prisma/client").Prisma.Prisma__ProductClient<({
        category: {
            id: string;
            organizationId: string;
            name: string;
            parentId: string | null;
        } | null;
        unit: {
            symbol: string | null;
            id: string;
            organizationId: string;
            name: string;
            isFractionable: boolean;
        } | null;
    } & {
        id: string;
        organizationId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        description: string | null;
        sku: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        categoryId: string | null;
        unitId: string | null;
        attributes: import("@prisma/client/runtime/library").JsonValue;
        lowStockThreshold: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(organizationId: string, id: string, data: Partial<CreateProductDto>): Promise<{
        id: string;
        organizationId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        description: string | null;
        sku: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        categoryId: string | null;
        unitId: string | null;
        attributes: import("@prisma/client/runtime/library").JsonValue;
        lowStockThreshold: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
    }>;
    remove(organizationId: string, id: string): Promise<{
        id: string;
        organizationId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        description: string | null;
        sku: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        categoryId: string | null;
        unitId: string | null;
        attributes: import("@prisma/client/runtime/library").JsonValue;
        lowStockThreshold: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
    }>;
}
