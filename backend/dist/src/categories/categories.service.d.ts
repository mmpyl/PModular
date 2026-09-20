import { PrismaService } from '../prisma.service';
export interface CreateCategoryDto {
    name: string;
    parentId?: string;
}
export declare class CategoriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(organizationId: string, data: CreateCategoryDto): Promise<{
        parent: {
            name: string;
            id: string;
            organizationId: string;
            parentId: string | null;
        } | null;
    } & {
        name: string;
        id: string;
        organizationId: string;
        parentId: string | null;
    }>;
    findAll(organizationId: string): import(".prisma/client").Prisma.PrismaPromise<({
        parent: {
            name: string;
            id: string;
            organizationId: string;
            parentId: string | null;
        } | null;
        _count: {
            products: number;
        };
    } & {
        name: string;
        id: string;
        organizationId: string;
        parentId: string | null;
    })[]>;
    findOne(organizationId: string, id: string): import(".prisma/client").Prisma.Prisma__CategoryClient<({
        products: {
            name: string;
            id: string;
            sku: string | null;
        }[];
        parent: {
            name: string;
            id: string;
            organizationId: string;
            parentId: string | null;
        } | null;
        children: {
            name: string;
            id: string;
            organizationId: string;
            parentId: string | null;
        }[];
    } & {
        name: string;
        id: string;
        organizationId: string;
        parentId: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(organizationId: string, id: string, data: Partial<CreateCategoryDto>): Promise<{
        name: string;
        id: string;
        organizationId: string;
        parentId: string | null;
    }>;
    remove(organizationId: string, id: string): Promise<{
        name: string;
        id: string;
        organizationId: string;
        parentId: string | null;
    }>;
}
