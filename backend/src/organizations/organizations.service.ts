import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface CreateOrganizationDto {
  name: string;
  businessTypeId: string;
  enabledModules?: string[];
  settings?: Record<string, any>;
}

export interface CreatePlatformOrganizationData extends CreateOrganizationDto {
  ownerEmail: string;
}

export interface UpdatePlatformOrganizationData extends Partial<CreateOrganizationDto> {
  ownerEmail?: string;
}

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOrganizationDto, creatorUserId: string) {
    // Obtener los defaultModules del BusinessType si no se proporcionan enabledModules
    const businessType = await this.prisma.businessType.findUnique({
      where: { id: data.businessTypeId },
    });

    if (!businessType) {
      throw new NotFoundException(`BusinessType con ID ${data.businessTypeId} no encontrado`);
    }

    const enabledModules = data.enabledModules || (businessType.defaultModules as string[]) || [];

    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: data.name,
          businessTypeId: data.businessTypeId,
          enabledModules,
          settings: data.settings || {},
        },
        include: { businessType: true },
      });

      await tx.membership.create({
        data: { userId: creatorUserId, organizationId: organization.id, role: 'OWNER' },
      });

      return organization;
    });
  }

  findAll(organizationId: string) {
    // Solo retornar la organización específica del tenant
    return this.prisma.organization.findMany({
      where: { id: organizationId },
      include: {
        businessType: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  findAllForPlatform() {
    return this.prisma.organization.findMany({
      include: {
        businessType: true,
        memberships: {
          where: { role: 'OWNER' },
          select: {
            role: true,
            user: { select: { id: true, email: true, name: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createForPlatform(data: CreatePlatformOrganizationData) {
    const [businessType, owner] = await Promise.all([
      this.prisma.businessType.findUnique({ where: { id: data.businessTypeId } }),
      this.prisma.user.findUnique({ where: { email: data.ownerEmail } }),
    ]);

    if (!businessType) {
      throw new NotFoundException(`BusinessType con ID ${data.businessTypeId} no encontrado`);
    }
    if (!owner) {
      throw new NotFoundException('El usuario owner debe registrarse antes de crear el negocio');
    }
    if (owner.platformRole) {
      throw new ForbiddenException('Una cuenta de plataforma no puede ser owner de un negocio');
    }

    const enabledModules = data.enabledModules ?? (businessType.defaultModules as string[]) ?? [];

    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: data.name,
          businessTypeId: data.businessTypeId,
          enabledModules,
          settings: data.settings ?? {},
        },
        include: { businessType: true },
      });

      await tx.membership.create({
        data: { userId: owner.id, organizationId: organization.id, role: 'OWNER' },
      });

      return organization;
    });
  }

  findOne(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: {
        businessType: true,
      },
    });
  }

  async update(id: string, data: Partial<CreateOrganizationDto>) {
    const existing = await this.prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Organización con ID ${id} no encontrada`);
    }

    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  async updateForPlatform(id: string, data: UpdatePlatformOrganizationData) {
    const existing = await this.prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Organización con ID ${id} no encontrada`);
    }

    if (data.businessTypeId) {
      const businessType = await this.prisma.businessType.findUnique({
        where: { id: data.businessTypeId },
      });
      if (!businessType) {
        throw new BadRequestException('El tipo de negocio seleccionado no existe');
      }
    }

    const { ownerEmail, ...organizationData } = data;
    const owner = ownerEmail
      ? await this.prisma.user.findUnique({ where: { email: ownerEmail } })
      : null;

    if (ownerEmail && !owner) {
      throw new NotFoundException('La cuenta owner debe registrarse antes de asignarla');
    }
    if (owner?.platformRole) {
      throw new ForbiddenException('Una cuenta de plataforma no puede ser owner de un negocio');
    }

    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.update({
        where: { id },
        data: organizationData,
        include: { businessType: true },
      });

      if (owner) {
        await tx.membership.upsert({
          where: { userId_organizationId: { userId: owner.id, organizationId: id } },
          update: { role: 'OWNER' },
          create: { userId: owner.id, organizationId: id, role: 'OWNER' },
        });
      }

      return organization;
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Organización con ID ${id} no encontrada`);
    }

    return this.prisma.organization.delete({
      where: { id },
    });
  }
}
