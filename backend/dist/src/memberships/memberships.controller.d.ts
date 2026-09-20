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
    create(createMembershipDto: CreateMembershipDto, organizationId: string): Promise<{
        organization: {
            name: string;
            id: string;
        };
        user: {
            name: string | null;
            id: string;
            email: string;
        };
    } & {
        id: string;
        organizationId: string;
        userId: string;
        role: import(".prisma/client").$Enums.OrgRole;
    }>;
    findByUser(userId: string, user: {
        sub: string;
        platformRole?: string;
    }): import(".prisma/client").Prisma.PrismaPromise<({
        organization: {
            businessType: {
                name: string;
                id: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                defaultModules: import("@prisma/client/runtime/library").JsonValue;
                productSchema: import("@prisma/client/runtime/library").JsonValue;
            };
        } & {
            name: string;
            id: string;
            status: import(".prisma/client").$Enums.OrganizationStatus;
            createdAt: Date;
            updatedAt: Date;
            enabledModules: import("@prisma/client/runtime/library").JsonValue;
            settings: import("@prisma/client/runtime/library").JsonValue;
            businessTypeId: string;
        };
    } & {
        id: string;
        organizationId: string;
        userId: string;
        role: import(".prisma/client").$Enums.OrgRole;
    })[]>;
    findByOrganization(organizationId: string, currentOrgId: string): import(".prisma/client").Prisma.PrismaPromise<({
        user: {
            name: string | null;
            id: string;
            email: string;
        };
    } & {
        id: string;
        organizationId: string;
        userId: string;
        role: import(".prisma/client").$Enums.OrgRole;
    })[]>;
    findOne(userId: string, organizationId: string, currentOrgId: string): import(".prisma/client").Prisma.Prisma__MembershipClient<({
        organization: {
            name: string;
            id: string;
        };
        user: {
            name: string | null;
            id: string;
            email: string;
        };
    } & {
        id: string;
        organizationId: string;
        userId: string;
        role: import(".prisma/client").$Enums.OrgRole;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(userId: string, organizationId: string, currentOrgId: string): Promise<{
        id: string;
        organizationId: string;
        userId: string;
        role: import(".prisma/client").$Enums.OrgRole;
    }>;
    updateRole(userId: string, organizationId: string, currentOrgId: string, role: OrgRole): Promise<{
        id: string;
        organizationId: string;
        userId: string;
        role: import(".prisma/client").$Enums.OrgRole;
    }>;
}
