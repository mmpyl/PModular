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
            id: string;
            organizationId: string;
            name: string;
            parentId: string | null;
        } | null;
    } & {
        id: string;
        organizationId: string;
        name: string;
        parentId: string | null;
    }>;
    findAll(organizationId: string): import(".prisma/client").Prisma.PrismaPromise<({
        _count: {
            products: number;
        };
        parent: {
            id: string;
            organizationId: string;
            name: string;
            parentId: string | null;
        } | null;
    } & {
        id: string;
        organizationId: string;
        name: string;
        parentId: string | null;
    })[]>;
    findOne(organizationId: string, id: string): import(".prisma/client").Prisma.Prisma__CategoryClient<({
        products: {
            id: string;
            name: string;
            sku: string | null;
        }[];
        parent: {
            id: string;
            organizationId: string;
            name: string;
            parentId: string | null;
        } | null;
        children: {
            id: string;
            organizationId: string;
            name: string;
            parentId: string | null;
        }[];
    } & {
        id: string;
        organizationId: string;
        name: string;
        parentId: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(organizationId: string, id: string, data: Partial<CreateCategoryDto>): Promise<{
        id: string;
        organizationId: string;
        name: string;
        parentId: string | null;
    }>;
    remove(organizationId: string, id: string): Promise<{
        id: string;
        organizationId: string;
        name: string;
        parentId: string | null;
    }>;
}
