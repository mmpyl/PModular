import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, Membership, OrgRole, PlatformRole } from '@prisma/client';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { MembershipsService } from '../memberships/memberships.service';
import { LoginDto } from './dto/login.dto';
type AuthResponse = {
    accessToken: string;
    user: Omit<User, 'password'>;
    organizationId?: string;
    orgRole?: OrgRole;
    platformRole?: PlatformRole;
};
type LoginResponse = AuthResponse & {
    memberships?: Membership[];
};
export declare class AuthService {
    private readonly usersService;
    private readonly membershipsService;
    private readonly jwtService;
    private readonly config;
    constructor(usersService: UsersService, membershipsService: MembershipsService, jwtService: JwtService, config: ConfigService);
    register(dto: CreateUserDto): Promise<AuthResponse>;
    login(dto: LoginDto): Promise<LoginResponse>;
    selectOrganization(userId: string, organizationId: string): Promise<LoginResponse>;
    private buildAuthResponse;
}
export {};
