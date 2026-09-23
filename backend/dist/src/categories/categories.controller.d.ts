import { CategoriesService } from './categories.service';
export interface CreateCategoryDto {
    name: string;
    parentId?: string;
}
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    create(createCategoryDto: CreateCategoryDto, organizationId: string): Promise<any>;
    findAll(organizationId: string): any;
    findOne(id: string, organizationId: string): any;
    update(id: string, updateCategoryDto: Partial<CreateCategoryDto>, organizationId: string): Promise<any>;
    remove(id: string, organizationId: string): Promise<any>;
}
