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
            name: string;
            id: string;
            organizationId: string;
            parentId: string | null;
        } | null;
        unit: {
            symbol: string | null;
            name: string;
            id: string;
            organizationId: string;
            isFractionable: boolean;
        } | null;
    } & {
        name: string;
        id: string;
        organizationId: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
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
            name: string;
            id: string;
            organizationId: string;
            parentId: string | null;
        } | null;
        unit: {
            symbol: string | null;
            name: string;
            id: string;
            organizationId: string;
            isFractionable: boolean;
        } | null;
    } & {
        name: string;
        id: string;
        organizationId: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
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
            name: string;
            id: string;
            organizationId: string;
            parentId: string | null;
        } | null;
        unit: {
            symbol: string | null;
            name: string;
            id: string;
            organizationId: string;
            isFractionable: boolean;
        } | null;
    } & {
        name: string;
        id: string;
        organizationId: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        sku: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        attributes: import("@prisma/client/runtime/library").JsonValue;
        isActive: boolean;
        categoryId: string | null;
        unitId: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(organizationId: string, id: string, data: Partial<CreateProductDto>): Promise<{
        name: string;
        id: string;
        organizationId: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        sku: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        attributes: import("@prisma/client/runtime/library").JsonValue;
        isActive: boolean;
        categoryId: string | null;
        unitId: string | null;
    }>;
    remove(organizationId: string, id: string): Promise<{
        name: string;
        id: string;
        organizationId: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        sku: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        attributes: import("@prisma/client/runtime/library").JsonValue;
        isActive: boolean;
        categoryId: string | null;
        unitId: string | null;
    }>;
}
