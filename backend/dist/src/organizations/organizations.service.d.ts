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
    create(data: CreateOrganizationDto, creatorUserId: string): Promise<any>;
    findAll(organizationId: string): any;
    findOne(id: string): any;
    update(id: string, data: Partial<CreateOrganizationDto>): Promise<any>;
    remove(id: string): Promise<any>;
    suspendOrganization(id: string): Promise<any>;
    reactivateOrganization(id: string): Promise<any>;
}
