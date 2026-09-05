import { PrismaService } from '../prisma.service';
export interface CreateCategoryDto {
    name: string;
    parentId?: string;
}
export declare class CategoriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(organizationId: string, data: CreateCategoryDto): Promise<any>;
    findAll(organizationId: string): any;
    findOne(organizationId: string, id: string): any;
    update(organizationId: string, id: string, data: Partial<CreateCategoryDto>): Promise<any>;
    remove(organizationId: string, id: string): Promise<any>;
}
