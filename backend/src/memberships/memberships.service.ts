import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrgRole } from '@prisma/client';
import { UsersService } from '../users/users.service';

export interface CreateMembershipDto {
  userId: string;
  organizationId: string;
  role?: OrgRole;
}

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService, private readonly usersService: UsersService) {}

  async addOrganizationMember(data: { email: string; name?: string; password?: string; organizationId: string; role?: OrgRole }) {
    let user = await this.usersService.findByEmail(data.email);
    if (!user) {
      if (!data.password) throw new BadRequestException('La contraseña es obligatoria para crear una cuenta nueva');
      user = await this.usersService.create({ email: data.email, name: data.name, password: data.password });
    }
    if (user.platformRole) throw new ForbiddenException('Una cuenta de plataforma no puede agregarse al equipo de negocio');

    const existing = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: data.organizationId } },
    });
    if (existing) throw new ConflictException('Este usuario ya pertenece al equipo');

    return this.prisma.membership.create({
      data: { userId: user.id, organizationId: data.organizationId, role: data.role ?? OrgRole.VENDEDOR },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }

  async create(data: CreateMembershipDto) {
    // Verificar que el usuario existe
    const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${data.userId} no encontrado`);
    }

    // Verificar que la organización existe
    const org = await this.prisma.organization.findUnique({ where: { id: data.organizationId } });
    if (!org) {
      throw new NotFoundException(`Organización con ID ${data.organizationId} no encontrada`);
    }

    return this.prisma.membership.create({
      data: {
        userId: data.userId,
        organizationId: data.organizationId,
        role: data.role || 'VENDEDOR',
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        organization: { select: { id: true, name: true } },
      },
    });
  }

  findByUser(userId: string) {
    return this.prisma.membership.findMany({
      where: { userId },
      include: {
        organization: {
          include: { businessType: true },
        },
      },
    });
  }

  findByOrganization(organizationId: string) {
    return this.prisma.membership.findMany({
      where: { organizationId },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });
  }

  findOne(userId: string, organizationId: string) {
    return this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        organization: { select: { id: true, name: true } },
      },
    });
  }

  async updateRole(userId: string, organizationId: string, role: OrgRole) {
    const existing = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Membresía no encontrada');
    }

    if (existing.role === OrgRole.OWNER && role !== OrgRole.OWNER) {
      const owners = await this.prisma.membership.count({ where: { organizationId, role: OrgRole.OWNER } });
      if (owners <= 1) throw new ForbiddenException('No se puede quitar el último owner del negocio');
    }

    return this.prisma.membership.update({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      data: { role },
    });
  }

  async remove(userId: string, organizationId: string) {
    const existing = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Membresía no encontrada');
    }

    // PREVENIR: No permitir eliminar al último OWNER de una organización
    if (existing.role === 'OWNER') {
      // Contar cuántos OWNERS hay en esta organización
      const ownerCount = await this.prisma.membership.count({
        where: {
          organizationId,
          role: 'OWNER',
        },
      });

      if (ownerCount <= 1) {
        throw new ForbiddenException('No se puede eliminar al último OWNER de la organización');
      }
    }

    return this.prisma.membership.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });
  }
}
