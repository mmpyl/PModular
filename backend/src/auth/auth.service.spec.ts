import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { MembershipsService } from '../memberships/memberships.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const password = bcrypt.hashSync('correct-password', 4);
  const user = {
    id: 'user-1',
    email: 'demo@pymen.dev',
    password,
    name: null,
    platformRole: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const platformUser = {
    ...user,
    email: 'platform@pymen.dev',
    platformRole: 'PLATFORM_ADMIN' as const,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: { create: jest.fn(), findByEmail: jest.fn() },
        },
        {
          provide: MembershipsService,
          useValue: { findByUser: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('signed-jwt') },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('1h') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('devuelve accessToken y usuario sin password en un login válido', async () => {
    usersService.findByEmail.mockResolvedValue(user);

    const result = await service.login({ email: user.email, password: 'correct-password' });

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { sub: user.id, email: user.email },
      { expiresIn: '1h' },
    );
    expect(result.accessToken).toBe('signed-jwt');
    expect(result.user).not.toHaveProperty('password');
  });

  it('rechaza login con contraseña incorrecta', async () => {
    usersService.findByEmail.mockResolvedValue(user);

    await expect(
      service.login({ email: user.email, password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza login si el usuario no existe', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: 'nope@pymen.dev', password: 'whatever1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza una cuenta de plataforma en el login de negocio', async () => {
    usersService.findByEmail.mockResolvedValue(platformUser);

    await expect(
      service.login({ email: platformUser.email, password: 'correct-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('permite login de plataforma solo a PLATFORM_ADMIN sin membresías', async () => {
    usersService.findByEmail.mockResolvedValue(platformUser);

    const result = await service.platformLogin({
      email: platformUser.email,
      password: 'correct-password',
    });

    expect(result.platformRole).toBe('PLATFORM_ADMIN');
    expect(result.organizationId).toBeUndefined();
    expect(result.memberships).toEqual([]);
  });

  it('rechaza una cuenta de negocio en el login de plataforma', async () => {
    usersService.findByEmail.mockResolvedValue(user);

    await expect(
      service.platformLogin({ email: user.email, password: 'correct-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza una cuenta de plataforma asociada a negocios', async () => {
    usersService.findByEmail.mockResolvedValue(platformUser);
    (service as any).membershipsService.findByUser.mockResolvedValue([
      { organizationId: 'business-1' },
    ]);

    await expect(
      service.platformLogin({ email: platformUser.email, password: 'correct-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
