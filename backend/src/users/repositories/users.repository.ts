import { Injectable } from '@nestjs/common';
import { OrgRole, Prisma, User } from '@prisma/client';
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

  findAllBusinessUsers() {
    return this.prisma.user.findMany({
      where: { platformRole: null },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          select: {
            organizationId: true,
            role: true,
            organization: { select: { id: true, name: true } },
          },
          orderBy: { organization: { name: 'asc' } },
        },
      },
      orderBy: { email: 'asc' },
    });
  }

  findBusinessUserById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, platformRole: null },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          select: {
            organizationId: true,
            role: true,
            organization: { select: { id: true, name: true } },
          },
          orderBy: { organization: { name: 'asc' } },
        },
      },
    });
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  findOrganizationsByIds(ids: string[]) {
    return this.prisma.organization.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
  }

  findUserMemberships(userId: string) {
    return this.prisma.membership.findMany({
      where: { userId },
      select: { organizationId: true, role: true },
    });
  }

  async syncMemberships(userId: string, memberships: { organizationId: string; role: OrgRole }[]) {
    return this.prisma.$transaction(async (tx) => {
      for (const membership of memberships) {
        await tx.membership.upsert({
          where: {
            userId_organizationId: { userId, organizationId: membership.organizationId },
          },
          update: { role: membership.role },
          create: { userId, organizationId: membership.organizationId, role: membership.role },
        });
      }

      await tx.membership.deleteMany({
        where: {
          userId,
          organizationId: { notIn: memberships.map((membership) => membership.organizationId) },
        },
      });
    });
  }

  deleteBusinessUser(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  countOtherOwners(userId: string, organizationId: string) {
    return this.prisma.membership.count({
      where: { organizationId, role: OrgRole.OWNER, userId: { not: userId } },
    });
  }
}
