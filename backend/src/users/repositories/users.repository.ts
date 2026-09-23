import { Injectable } from '@nestjs/common';
import { Prisma, User, PlatformRole } from '@prisma/client';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Actualiza el rol de plataforma de un usuario
   */
  updatePlatformRole(userId: string, role: PlatformRole | null): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { platformRole: role },
    });
  }

  /**
   * Cuenta cuántos usuarios tienen rol PLATFORM_ADMIN
   */
  async countPlatformAdmins(): Promise<number> {
    return this.prisma.user.count({
      where: { platformRole: PlatformRole.PLATFORM_ADMIN },
    });
  }
}
