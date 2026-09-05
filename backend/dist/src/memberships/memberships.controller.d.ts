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
    create(createMembershipDto: CreateMembershipDto): Promise<any>;
    findByUser(userId: string): any;
    findByOrganization(organizationId: string): any;
    findOne(userId: string, organizationId: string): any;
    remove(userId: string, organizationId: string): Promise<any>;
}
