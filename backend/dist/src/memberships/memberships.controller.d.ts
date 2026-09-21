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
        user: {
            id: string;
            name: string | null;
            email: string;
        };
        organization: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        userId: string;
        organizationId: string;
        role: import(".prisma/client").$Enums.OrgRole;
    }>;
    findByUser(userId: string, user: {
        sub: string;
        platformRole?: string;
    }): import(".prisma/client").Prisma.PrismaPromise<({
        organization: {
            businessType: {
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                code: string;
                description: string | null;
                defaultModules: import("@prisma/client/runtime/library").JsonValue;
                productSchema: import("@prisma/client/runtime/library").JsonValue;
            };
        } & {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            businessTypeId: string;
            status: import(".prisma/client").$Enums.OrganizationStatus;
            enabledModules: import("@prisma/client/runtime/library").JsonValue;
            settings: import("@prisma/client/runtime/library").JsonValue;
        };
    } & {
        id: string;
        userId: string;
        organizationId: string;
        role: import(".prisma/client").$Enums.OrgRole;
    })[]>;
    findByOrganization(organizationId: string, currentOrgId: string): import(".prisma/client").Prisma.PrismaPromise<({
        user: {
            id: string;
            name: string | null;
            email: string;
        };
    } & {
        id: string;
        userId: string;
        organizationId: string;
        role: import(".prisma/client").$Enums.OrgRole;
    })[]>;
    findOne(userId: string, organizationId: string, currentOrgId: string): import(".prisma/client").Prisma.Prisma__MembershipClient<({
        user: {
            id: string;
            name: string | null;
            email: string;
        };
        organization: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        userId: string;
        organizationId: string;
        role: import(".prisma/client").$Enums.OrgRole;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(userId: string, organizationId: string, currentOrgId: string): Promise<{
        id: string;
        userId: string;
        organizationId: string;
        role: import(".prisma/client").$Enums.OrgRole;
    }>;
    updateRole(userId: string, organizationId: string, currentOrgId: string, role: OrgRole): Promise<{
        id: string;
        userId: string;
        organizationId: string;
        role: import(".prisma/client").$Enums.OrgRole;
    }>;
}
