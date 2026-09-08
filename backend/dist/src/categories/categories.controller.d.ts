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
        _count: {
            products: number;
        };
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
    })[]>;
    findOne(id: string, organizationId: string): import(".prisma/client").Prisma.Prisma__CategoryClient<({
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
    update(id: string, updateCategoryDto: Partial<CreateCategoryDto>, organizationId: string): Promise<{
        name: string;
        id: string;
        organizationId: string;
        parentId: string | null;
    }>;
    remove(id: string, organizationId: string): Promise<{
        name: string;
        id: string;
        organizationId: string;
        parentId: string | null;
    }>;
}
