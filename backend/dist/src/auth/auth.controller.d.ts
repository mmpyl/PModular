import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: CreateUserDto): Promise<{
        accessToken: string;
        user: Omit<User, "password">;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: Omit<User, "password">;
    }>;
    adminCheck(): {
        ok: boolean;
    };
}
