import { OrganizationsService, BusinessSettingsDto } from './organizations.service';
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
    }>;
    findAll(organizationId: string): import(".prisma/client").Prisma.PrismaPromise<({
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
    })[]>;
    findOne(id: string, organizationId: string): import(".prisma/client").Prisma.Prisma__OrganizationClient<({
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
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    getBusinessSettings(id: string, organizationId: string): Promise<BusinessSettingsDto>;
    update(id: string, updateOrgDto: Partial<CreateOrganizationDto>, organizationId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrganizationStatus;
        enabledModules: import("@prisma/client/runtime/library").JsonValue;
        settings: import("@prisma/client/runtime/library").JsonValue;
        businessTypeId: string;
    }>;
    remove(id: string, organizationId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrganizationStatus;
        enabledModules: import("@prisma/client/runtime/library").JsonValue;
        settings: import("@prisma/client/runtime/library").JsonValue;
        businessTypeId: string;
    }>;
}
export declare class PlatformOrganizationsController {
    private readonly organizationsService;
    constructor(organizationsService: OrganizationsService);
    suspend(id: string): Promise<{
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
    }>;
    reactivate(id: string): Promise<{
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
    }>;
}
