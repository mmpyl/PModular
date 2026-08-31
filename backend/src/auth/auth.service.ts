import { UnauthorizedException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt-payload.type';

type AuthResponse = {
  accessToken: string;
  user: Omit<User, 'passwordHash'>;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: CreateUserDto): Promise<AuthResponse> {
    const user = await this.usersService.create(dto);
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    const isPasswordValid = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user);
  }

  private async buildAuthResponse(user: User): Promise<AuthResponse> {
    const payload: JwtPayload = { sub: user.id, email: user.email, roles: user.roles };
    const { passwordHash, ...safeUser } = user;

    return {
      accessToken: await this.jwtService.signAsync(payload, {
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '1h'),
      }),
      user: safeUser,
    };
  }
}
