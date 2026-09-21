import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { MembershipsService } from '../memberships/memberships.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Request } from 'express';
export declare class SelectOrganizationDto {
    organizationId: string;
}
export declare class PlatformLoginDto {
    email: string;
    password: string;
}
export declare class AuthController {
    private readonly authService;
    private readonly membershipsService;
    constructor(authService: AuthService, membershipsService: MembershipsService);
    register(dto: CreateUserDto): Promise<{
        accessToken: string;
        user: Omit<User, "password">;
        organizationId?: string;
        orgRole?: OrgRole;
        platformRole?: PlatformRole;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: Omit<User, "password">;
        organizationId?: string;
        orgRole?: OrgRole;
        platformRole?: PlatformRole;
    } & {
        memberships?: Membership[];
    }>;
    platformLogin(req: Request): Promise<{
        accessToken: string;
        user: Omit<User, "password">;
        organizationId?: string;
        orgRole?: OrgRole;
        platformRole?: PlatformRole;
    }>;
    selectOrganization(dto: SelectOrganizationDto, req: Request): Promise<{
        accessToken: string;
        user: Omit<User, "password">;
        organizationId?: string;
        orgRole?: OrgRole;
        platformRole?: PlatformRole;
    } & {
        memberships?: Membership[];
    }>;
    getMemberships(req: Request): Promise<any>;
    adminCheck(): {
        ok: boolean;
    };
}
