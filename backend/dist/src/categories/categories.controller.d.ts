import { CategoriesService } from './categories.service';
export interface CreateCategoryDto {
    name: string;
    parentId?: string;
}
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    create(createCategoryDto: CreateCategoryDto, organizationId: string): Promise<{
        parent: {
            id: string;
            name: string;
            organizationId: string;
            parentId: string | null;
        } | null;
    } & {
        id: string;
        name: string;
        organizationId: string;
        parentId: string | null;
    }>;
    findAll(organizationId: string): import(".prisma/client").Prisma.PrismaPromise<({
        parent: {
            id: string;
            name: string;
            organizationId: string;
            parentId: string | null;
        } | null;
        _count: {
            products: number;
        };
    } & {
        id: string;
        name: string;
        organizationId: string;
        parentId: string | null;
    })[]>;
    findOne(id: string, organizationId: string): import(".prisma/client").Prisma.Prisma__CategoryClient<({
        products: {
            id: string;
            name: string;
            sku: string | null;
        }[];
        parent: {
            id: string;
            name: string;
            organizationId: string;
            parentId: string | null;
        } | null;
        children: {
            id: string;
            name: string;
            organizationId: string;
            parentId: string | null;
        }[];
    } & {
        id: string;
        name: string;
        organizationId: string;
        parentId: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(id: string, organizationId: string): Promise<{
        id: string;
        name: string;
        organizationId: string;
        parentId: string | null;
    }>;
}
