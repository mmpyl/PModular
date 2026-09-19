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
    create(organizationId: string, data: CreateProductDto): Promise<{
        category: {
            id: string;
            name: string;
            organizationId: string;
            parentId: string | null;
        } | null;
        unit: {
            symbol: string | null;
            id: string;
            name: string;
            organizationId: string;
            isFractionable: boolean;
        } | null;
    } & {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        sku: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        attributes: import("@prisma/client/runtime/library").JsonValue;
        isActive: boolean;
        categoryId: string | null;
        unitId: string | null;
    }>;
    findAll(organizationId: string, options?: {
        categoryId?: string;
        search?: string;
    }): import(".prisma/client").Prisma.PrismaPromise<({
        category: {
            id: string;
            name: string;
            organizationId: string;
            parentId: string | null;
        } | null;
        unit: {
            symbol: string | null;
            id: string;
            name: string;
            organizationId: string;
            isFractionable: boolean;
        } | null;
    } & {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        sku: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        attributes: import("@prisma/client/runtime/library").JsonValue;
        isActive: boolean;
        categoryId: string | null;
        unitId: string | null;
    })[]>;
    findOne(organizationId: string, id: string): import(".prisma/client").Prisma.Prisma__ProductClient<({
        category: {
            id: string;
            name: string;
            organizationId: string;
            parentId: string | null;
        } | null;
        unit: {
            symbol: string | null;
            id: string;
            name: string;
            organizationId: string;
            isFractionable: boolean;
        } | null;
    } & {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        sku: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        attributes: import("@prisma/client/runtime/library").JsonValue;
        isActive: boolean;
        categoryId: string | null;
        unitId: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(organizationId: string, id: string, data: Partial<CreateProductDto>): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        sku: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        attributes: import("@prisma/client/runtime/library").JsonValue;
        isActive: boolean;
        categoryId: string | null;
        unitId: string | null;
    }>;
    remove(organizationId: string, id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        organizationId: string;
        sku: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        attributes: import("@prisma/client/runtime/library").JsonValue;
        isActive: boolean;
        categoryId: string | null;
        unitId: string | null;
    }>;
}
