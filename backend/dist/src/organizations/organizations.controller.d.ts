import { OrganizationsService } from './organizations.service';
export interface CreateOrganizationDto {
    name: string;
    businessTypeId: string;
    enabledModules?: string[];
    settings?: Record<string, any>;
}
export declare class OrganizationsController {
    private readonly organizationsService;
    constructor(organizationsService: OrganizationsService);
    create(createOrgDto: CreateOrganizationDto, user: {
        sub: string;
    }): Promise<{
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
    }>;
    findAll(organizationId: string): import(".prisma/client").Prisma.PrismaPromise<({
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
    })[]>;
    findOne(id: string, organizationId: string): import(".prisma/client").Prisma.Prisma__OrganizationClient<({
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
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, updateOrgDto: Partial<CreateOrganizationDto>, organizationId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        enabledModules: import("@prisma/client/runtime/library").JsonValue;
        settings: import("@prisma/client/runtime/library").JsonValue;
        businessTypeId: string;
    }>;
    remove(id: string, organizationId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        enabledModules: import("@prisma/client/runtime/library").JsonValue;
        settings: import("@prisma/client/runtime/library").JsonValue;
        businessTypeId: string;
    }>;
}
