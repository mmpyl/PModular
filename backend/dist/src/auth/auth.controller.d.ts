import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { MembershipsService } from '../memberships/memberships.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Request } from 'express';
export declare class SelectOrganizationDto {
    organizationId: string;
}
export declare class AuthController {
    private readonly authService;
    private readonly membershipsService;
    constructor(authService: AuthService, membershipsService: MembershipsService);
    register(dto: CreateUserDto): Promise<{
        accessToken: string;
        user: Omit<import(".prisma/client").User, "password">;
        organizationId?: string;
        orgRole?: import(".prisma/client").OrgRole;
        platformRole?: import(".prisma/client").PlatformRole;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: Omit<import(".prisma/client").User, "password">;
        organizationId?: string;
        orgRole?: import(".prisma/client").OrgRole;
        platformRole?: import(".prisma/client").PlatformRole;
    } & {
        memberships?: import(".prisma/client").Membership[];
    }>;
    selectOrganization(dto: SelectOrganizationDto, req: Request): Promise<{
        accessToken: string;
        user: Omit<import(".prisma/client").User, "password">;
        organizationId?: string;
        orgRole?: import(".prisma/client").OrgRole;
        platformRole?: import(".prisma/client").PlatformRole;
    }>;
    getMemberships(req: Request): Promise<({
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
    adminCheck(): {
        ok: boolean;
    };
}
