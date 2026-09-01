import { UnauthorizedException, Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, Membership, OrgRole, PlatformRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { MembershipsService } from '../memberships/memberships.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt-payload.type';

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

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly membershipsService: MembershipsService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: CreateUserDto): Promise<AuthResponse> {
    const user = await this.usersService.create(dto);
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    const isPasswordValid = user ? await bcrypt.compare(dto.password, user.password) : false;

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Obtener membresías del usuario
    const memberships = await this.membershipsService.findByUser(user.id);

    // Si el usuario proporcionó organizationId en el login
    if (dto.organizationId) {
      const membership = memberships.find(m => m.organizationId === dto.organizationId);
      if (!membership) {
        throw new ForbiddenException('You do not have access to this organization');
      }
      return this.buildAuthResponse(user, membership.organizationId, membership.role);
    }

    // Si el usuario tiene exactamente una membresía, usarla automáticamente
    if (memberships.length === 1) {
      const membership = memberships[0];
      return this.buildAuthResponse(user, membership.organizationId, membership.role);
    }

    // Si tiene múltiples membresías o ninguna, devolver token sin org + lista de membresías
    const response = await this.buildAuthResponse(user);
    return {
      ...response,
      memberships,
    };
  }

  async selectOrganization(userId: string, organizationId: string): Promise<AuthResponse> {
    const membership = await this.membershipsService.findOne(userId, organizationId);
    
    if (!membership) {
      throw new ForbiddenException('You do not have access to this organization');
    }

    // Obtener el usuario completo desde la base de datos
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.buildAuthResponse(user, membership.organizationId, membership.role);
  }

  private async buildAuthResponse(user: User, organizationId?: string, orgRole?: OrgRole): Promise<AuthResponse> {
    const payload: JwtPayload = { 
      sub: user.id, 
      email: user.email,
      ...(organizationId && { organizationId }),
      ...(orgRole && { orgRole }),
      ...(user.platformRole && { platformRole: user.platformRole }),
    };
    const { password, ...safeUser } = user;

    return {
      accessToken: await this.jwtService.signAsync(payload, {
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '1h'),
      }),
      user: safeUser,
      ...(organizationId && { organizationId }),
      ...(orgRole && { orgRole }),
      ...(user.platformRole && { platformRole: user.platformRole }),
    };
  }
}
