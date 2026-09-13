import { PrismaService } from '../prisma.service';
export interface CreateOrganizationDto {
    name: string;
    businessTypeId: string;
    enabledModules?: string[];
    settings?: Record<string, any>;
}
export declare class OrganizationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: CreateOrganizationDto, creatorUserId: string): Promise<{
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
    }>;
    findAll(organizationId: string): import(".prisma/client").Prisma.PrismaPromise<({
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
    })[]>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__OrganizationClient<({
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
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, data: Partial<CreateOrganizationDto>): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        businessTypeId: string;
        enabledModules: import("@prisma/client/runtime/library").JsonValue;
        settings: import("@prisma/client/runtime/library").JsonValue;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        businessTypeId: string;
        enabledModules: import("@prisma/client/runtime/library").JsonValue;
        settings: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
