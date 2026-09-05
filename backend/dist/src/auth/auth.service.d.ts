import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
type AuthResponse = {
    accessToken: string;
    user: Omit<User, 'password'>;
};
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly config;
    constructor(usersService: UsersService, jwtService: JwtService, config: ConfigService);
    register(dto: CreateUserDto): Promise<AuthResponse>;
    login(dto: LoginDto): Promise<AuthResponse>;
    private buildAuthResponse;
}
export {};
