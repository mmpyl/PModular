import { PrismaService } from '../prisma.service';
export interface CreateOrganizationDto {
    name: string;
    businessTypeId: string;
    enabledModules?: string[];
    settings?: Record<string, any>;
}
export declare class OrganizationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: CreateOrganizationDto): Promise<any>;
    findAll(): any;
    findOne(id: string): any;
    update(id: string, data: Partial<CreateOrganizationDto>): Promise<any>;
    remove(id: string): Promise<any>;
}
