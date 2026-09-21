import { MembershipsService } from './memberships.service';
import { OrgRole } from '@prisma/client';
export interface CreateMembershipDto {
    userId: string;
    organizationId: string;
    role?: OrgRole;
}
export declare class MembershipsController {
    private readonly membershipsService;
    constructor(membershipsService: MembershipsService);
    create(createMembershipDto: CreateMembershipDto, organizationId: string): Promise<any>;
    findByUser(userId: string, user: {
        sub: string;
        platformRole?: string;
    }): any;
    findByOrganization(organizationId: string, currentOrgId: string): any;
    findOne(userId: string, organizationId: string, currentOrgId: string): any;
    remove(userId: string, organizationId: string, currentOrgId: string): Promise<any>;
    updateRole(userId: string, organizationId: string, currentOrgId: string, role: OrgRole): Promise<any>;
}
