import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface CreateOrganizationDto {
  name: string;
  businessTypeId: string;
  enabledModules?: string[];
  settings?: Record<string, any>;
}

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOrganizationDto) {
    // Obtener los defaultModules del BusinessType si no se proporcionan enabledModules
    const businessType = await this.prisma.businessType.findUnique({
      where: { id: data.businessTypeId },
    });

    if (!businessType) {
      throw new NotFoundException(`BusinessType con ID ${data.businessTypeId} no encontrado`);
    }

    const enabledModules = data.enabledModules || (businessType.defaultModules as string[]) || [];

    return this.prisma.organization.create({
      data: {
        name: data.name,
        businessTypeId: data.businessTypeId,
        enabledModules,
        settings: data.settings || {},
      },
      include: {
        businessType: true,
      },
    });
  }

  findAll() {
    return this.prisma.organization.findMany({
      include: {
        businessType: true,
      },
      orderBy: { name: 'asc' },
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
