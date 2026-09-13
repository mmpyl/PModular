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
            email: string;
            name: string | null;
        };
        organization: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        role: import(".prisma/client").$Enums.OrgRole;
        userId: string;
        organizationId: string;
    }>;
    findByUser(userId: string, user: {
        sub: string;
        platformRole?: string;
    }): import(".prisma/client").Prisma.PrismaPromise<({
        organization: {
            businessType: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                description: string | null;
                defaultModules: import("@prisma/client/runtime/library").JsonValue;
                productSchema: import("@prisma/client/runtime/library").JsonValue;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            businessTypeId: string;
            enabledModules: import("@prisma/client/runtime/library").JsonValue;
            settings: import("@prisma/client/runtime/library").JsonValue;
        };
    } & {
        id: string;
        role: import(".prisma/client").$Enums.OrgRole;
        userId: string;
        organizationId: string;
    })[]>;
    findByOrganization(organizationId: string, currentOrgId: string): import(".prisma/client").Prisma.PrismaPromise<({
        user: {
            id: string;
            email: string;
            name: string | null;
        };
    } & {
        id: string;
        role: import(".prisma/client").$Enums.OrgRole;
        userId: string;
        organizationId: string;
    })[]>;
    findOne(userId: string, organizationId: string, currentOrgId: string): import(".prisma/client").Prisma.Prisma__MembershipClient<({
        user: {
            id: string;
            email: string;
            name: string | null;
        };
        organization: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        role: import(".prisma/client").$Enums.OrgRole;
        userId: string;
        organizationId: string;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    remove(userId: string, organizationId: string, currentOrgId: string): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.OrgRole;
        userId: string;
        organizationId: string;
    }>;
    updateRole(userId: string, organizationId: string, role: OrgRole, currentOrgId: string): Promise<{
        id: string;
        role: import(".prisma/client").$Enums.OrgRole;
        userId: string;
        organizationId: string;
    }>;
}
