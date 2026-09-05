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
            id: string;
            name: string;
        };
        user: {
            id: string;
            name: string | null;
            email: string;
        };
    } & {
        id: string;
        organizationId: string;
        userId: string;
        role: import(".prisma/client").$Enums.OrgRole;
    }>;
    findByUser(userId: string): import(".prisma/client").Prisma.PrismaPromise<({
        organization: {
            businessType: {
                id: string;
                code: string;
                name: string;
                description: string | null;
                defaultModules: import("@prisma/client/runtime/library").JsonValue;
                productSchema: import("@prisma/client/runtime/library").JsonValue;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            name: string;
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
            id: string;
            name: string | null;
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
            id: string;
            name: string;
        };
        user: {
            id: string;
            name: string | null;
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
}
