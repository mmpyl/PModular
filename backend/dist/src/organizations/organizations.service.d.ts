import { PrismaService } from '../prisma.service';
export interface CreateOrganizationDto {
    name: string;
    businessTypeId: string;
    enabledModules?: string[];
    settings?: Record<string, any>;
}
export interface BusinessSettingsDto {
    currency: string;
    timezone: string;
    defaultTaxRate: number;
}
export declare class OrganizationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: CreateOrganizationDto, creatorUserId: string): Promise<{
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
    findOne(id: string): import(".prisma/client").Prisma.Prisma__OrganizationClient<({
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
    getBusinessSettings(organizationId: string): Promise<{
        currency: any;
        timezone: any;
        defaultTaxRate: any;
    }>;
    update(id: string, data: Partial<CreateOrganizationDto>): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrganizationStatus;
        enabledModules: import("@prisma/client/runtime/library").JsonValue;
        settings: import("@prisma/client/runtime/library").JsonValue;
        businessTypeId: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrganizationStatus;
        enabledModules: import("@prisma/client/runtime/library").JsonValue;
        settings: import("@prisma/client/runtime/library").JsonValue;
        businessTypeId: string;
    }>;
    suspendOrganization(id: string): Promise<{
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
    reactivateOrganization(id: string): Promise<{
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
