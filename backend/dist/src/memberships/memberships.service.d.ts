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
    create(data: CreateMembershipDto): Promise<{
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
        userId: string;
        organizationId: string;
        role: import(".prisma/client").$Enums.OrgRole;
    }>;
    findByUser(userId: string): import(".prisma/client").Prisma.PrismaPromise<({
        organization: {
            businessType: {
                id: string;
                createdAt: Date;
                name: string;
                updatedAt: Date;
                description: string | null;
                code: string;
                defaultModules: import("@prisma/client/runtime/library").JsonValue;
                productSchema: import("@prisma/client/runtime/library").JsonValue;
            };
        } & {
            id: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.OrganizationStatus;
            enabledModules: import("@prisma/client/runtime/library").JsonValue;
            settings: import("@prisma/client/runtime/library").JsonValue;
            businessTypeId: string;
        };
    } & {
        id: string;
        userId: string;
        organizationId: string;
        role: import(".prisma/client").$Enums.OrgRole;
    })[]>;
    findByOrganization(organizationId: string): import(".prisma/client").Prisma.PrismaPromise<({
        user: {
            id: string;
            email: string;
            name: string | null;
        };
    } & {
        id: string;
        userId: string;
        organizationId: string;
        role: import(".prisma/client").$Enums.OrgRole;
    })[]>;
    findOne(userId: string, organizationId: string): import(".prisma/client").Prisma.Prisma__MembershipClient<({
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
        userId: string;
        organizationId: string;
        role: import(".prisma/client").$Enums.OrgRole;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    updateRole(userId: string, organizationId: string, role: OrgRole): Promise<{
        id: string;
        userId: string;
        organizationId: string;
        role: import(".prisma/client").$Enums.OrgRole;
    }>;
    remove(userId: string, organizationId: string): Promise<{
        id: string;
        userId: string;
        organizationId: string;
        role: import(".prisma/client").$Enums.OrgRole;
    }>;
}
