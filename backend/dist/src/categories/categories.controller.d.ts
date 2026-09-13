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
    findOne(id: string, organizationId: string): import(".prisma/client").Prisma.Prisma__CategoryClient<({
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
    update(id: string, updateCategoryDto: Partial<CreateCategoryDto>, organizationId: string): Promise<{
        id: string;
        organizationId: string;
        name: string;
        parentId: string | null;
    }>;
    remove(id: string, organizationId: string): Promise<{
        id: string;
        organizationId: string;
        name: string;
        parentId: string | null;
    }>;
}
