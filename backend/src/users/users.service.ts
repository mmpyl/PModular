import { ConflictException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { User, PlatformRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const password = await bcrypt.hash(dto.password, 12);
    return this.usersRepository.create({
      email: dto.email.toLowerCase(),
      password,
      name: dto.name ?? null,
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email.toLowerCase());
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  /**
   * Asigna un rol de plataforma a un usuario.
   * Solo PLATFORM_ADMIN puede ejecutar esta acción.
   * Valida que no se quite el rol al último PLATFORM_ADMIN.
   */
  async assignPlatformRole(
    userId: string,
    role: PlatformRole | null,
    currentAdminId: string,
  ): Promise<User> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    // Si estamos quitando el rol PLATFORM_ADMIN del último admin, bloquear
    if (
      user.platformRole === PlatformRole.PLATFORM_ADMIN &&
      (role === null || role === PlatformRole.SUPPORT)
    ) {
      const adminCount = await this.usersRepository.countPlatformAdmins();
      if (adminCount <= 1 && user.id === currentAdminId) {
        throw new ForbiddenException(
          'No es posible remover el rol PLATFORM_ADMIN del último administrador de plataforma',
        );
      }
      if (adminCount <= 1 && user.id !== currentAdminId) {
        throw new ForbiddenException(
          'No es posible remover el rol PLATFORM_ADMIN porque quedaría la plataforma sin administradores',
        );
      }
    }

    return this.usersRepository.updatePlatformRole(userId, role);
  }

  /**
   * Obtiene el conteo de administradores de plataforma
   */
  async getPlatformAdminCount(): Promise<number> {
    return this.usersRepository.countPlatformAdmins();
  }
}
