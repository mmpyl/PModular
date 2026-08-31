import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrgRole } from '@prisma/client';

export interface CreateMembershipDto {
  userId: string;
  organizationId: string;
  role?: OrgRole;
}

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

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
