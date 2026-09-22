import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface CreateOrganizationDto {
  name: string;
  businessTypeId: string;
  enabledModules?: string[];
  settings?: Record<string, any>;
}

export interface BusinessSettingsDto {
  currency: string;
  timezone: string;
  defaultTaxRate: number;
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

  findOne(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },
      include: {
        businessType: true,
      },
    });
  }

  /**
   * Obtener configuración de negocio de una organización
   * Retorna valores por defecto si no están configurados
   */
  async getBusinessSettings(organizationId: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });

    if (!organization) {
      throw new NotFoundException(`Organización con ID ${organizationId} no encontrada`);
    }

    const settings = (organization.settings as Record<string, any>) || {};
    
    // Retornar configuración con valores por defecto
    return {
      currency: settings.currency || 'PEN',
      timezone: settings.timezone || 'America/Lima',
      defaultTaxRate: settings.defaultTaxRate ?? 0.18,
    };
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

  // ==========================================
  // FASE 4: Suspensión de organizaciones (moderación de plataforma)
  // ==========================================

  /**
   * Suspender una organización - Solo PLATFORM_ADMIN
   * La suspensión surte efecto inmediato porque TenantGuard verifica el status en cada request
   */
  async suspendOrganization(id: string) {
    const existing = await this.prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Organización con ID ${id} no encontrada`);
    }

    return this.prisma.organization.update({
      where: { id },
      data: { status: 'SUSPENDED' },
      include: { businessType: true },
    });
  }

  /**
   * Reactivar una organización suspendida - Solo PLATFORM_ADMIN
   */
  async reactivateOrganization(id: string) {
    const existing = await this.prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Organización con ID ${id} no encontrada`);
    }

    return this.prisma.organization.update({
      where: { id },
      data: { status: 'ACTIVE' },
      include: { businessType: true },
    });
  }
}
