import { PrismaService } from '../prisma.service';
import { OrgRole } from '@prisma/client';
export interface CreateMembershipDto {
    userId: string;
    organizationId: string;
    role?: OrgRole;
}
export declare class MembershipsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: CreateMembershipDto): Promise<any>;
    findByUser(userId: string): any;
    findByOrganization(organizationId: string): any;
    findOne(userId: string, organizationId: string): any;
    updateRole(userId: string, organizationId: string, role: OrgRole): Promise<any>;
    remove(userId: string, organizationId: string): Promise<any>;
}
