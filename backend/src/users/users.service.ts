import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrgRole, Prisma, User } from '@prisma/client';
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

  listBusinessUsers() {
    return this.usersRepository.findAllBusinessUsers();
  }

  async findBusinessUser(id: string) {
    const user = await this.usersRepository.findBusinessUserById(id);
    if (!user) throw new NotFoundException('Usuario de negocio no encontrado');
    return user;
  }

  async createBusinessUser(data: {
    email: string;
    name?: string;
    password: string;
    memberships?: { organizationId: string; role: OrgRole }[];
  }) {
    const memberships = data.memberships ?? [];
    await this.validateMemberships(memberships);
    const user = await this.create({ email: data.email, name: data.name, password: data.password });
    if (memberships.length) {
      await this.usersRepository.syncMemberships(user.id, memberships);
    }
    return this.findBusinessUser(user.id);
  }

  async updateBusinessUser(
    id: string,
    data: {
      email?: string;
      name?: string | null;
      password?: string;
      memberships?: { organizationId: string; role: OrgRole }[];
    },
  ) {
    const existing = await this.findBusinessUser(id);
    if (data.memberships) {
      await this.validateMemberships(data.memberships);
      await this.ensureOwnersRemain(id, data.memberships);
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (data.email !== undefined) updateData.email = data.email.toLowerCase();
    if (data.name !== undefined) updateData.name = data.name;
    if (data.password) updateData.password = await bcrypt.hash(data.password, 12);

    if (Object.keys(updateData).length) {
      try {
        await this.usersRepository.update(existing.id, updateData);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new ConflictException('Email already registered');
        }
        throw error;
      }
    }

    if (data.memberships) {
      await this.usersRepository.syncMemberships(id, data.memberships);
    }
    return this.findBusinessUser(id);
  }

  async deleteBusinessUser(id: string) {
    const user = await this.findBusinessUser(id);
    await this.ensureOwnersRemain(id, []);
    await this.usersRepository.deleteBusinessUser(user.id);
    return { id: user.id, deleted: true };
  }

  private async validateMemberships(memberships: { organizationId: string; role: OrgRole }[]) {
    const ids = memberships.map((membership) => membership.organizationId);
    if (new Set(ids).size !== ids.length) {
      throw new ConflictException('Una organización no puede aparecer más de una vez');
    }
    if (!ids.length) return;

    const organizations = await this.usersRepository.findOrganizationsByIds(ids);
    if (organizations.length !== ids.length) {
      throw new NotFoundException('Una o más organizaciones no existen');
    }
  }

  private async ensureOwnersRemain(
    userId: string,
    nextMemberships: { organizationId: string; role: OrgRole }[],
  ) {
    const currentMemberships = await this.usersRepository.findUserMemberships(userId);
    const retainedOwnerOrganizations = new Set(
      nextMemberships.filter((membership) => membership.role === OrgRole.OWNER)
        .map((membership) => membership.organizationId),
    );

    for (const membership of currentMemberships) {
      if (membership.role !== OrgRole.OWNER || retainedOwnerOrganizations.has(membership.organizationId)) {
        continue;
      }
      const otherOwners = await this.usersRepository.countOtherOwners(userId, membership.organizationId);
      if (otherOwners === 0) {
        throw new ForbiddenException('No se puede quitar o eliminar al último owner de un negocio');
      }
    }
  }
}
