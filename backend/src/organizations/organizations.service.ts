<<<<<<< HEAD
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
=======
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { ModuleCatalogService } from "../module-catalog/module-catalog.service";
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540

export interface CreateOrganizationDto {
  name: string;
  businessTypeId: string;
  settings?: Record<string, any>;
}

<<<<<<< HEAD
export interface CreatePlatformOrganizationData extends CreateOrganizationDto {
  ownerEmail: string;
  enabledModules?: string[];
}

export interface UpdatePlatformOrganizationData extends Partial<CreatePlatformOrganizationData> {
  ownerEmail?: string;
=======
export interface BusinessSettingsDto {
  currency: string;
  timezone: string;
  defaultTaxRate: number;
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540
}

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moduleCatalogService: ModuleCatalogService,
  ) {}

  async create(data: CreateOrganizationDto, creatorUserId: string) {
    // Obtener los defaultModules del BusinessType si no se proporcionan enabledModules
    const businessType = await this.prisma.businessType.findUnique({
      where: { id: data.businessTypeId },
    });

    if (!businessType) {
      throw new NotFoundException(
        `BusinessType con ID ${data.businessTypeId} no encontrado`,
      );
    }

<<<<<<< HEAD
    const enabledModules = (businessType.defaultModules as string[]) || [];
=======
    const enabledModules =
      data.enabledModules || (businessType.defaultModules as string[]) || [];
    this.assertValidModules(enabledModules);
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540

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
        data: {
          userId: creatorUserId,
          organizationId: organization.id,
          role: "OWNER",
        },
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
      orderBy: { name: "asc" },
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
    this.validateEnabledModules(enabledModules, businessType);

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
      throw new NotFoundException(
        `Organización con ID ${organizationId} no encontrada`,
      );
    }

    const settings = (organization.settings as Record<string, any>) || {};

    // Retornar configuración con valores por defecto
    return {
      currency: settings.currency || "PEN",
      timezone: settings.timezone || "America/Lima",
      defaultTaxRate: settings.defaultTaxRate ?? 0.18,
    };
  }

  async update(id: string, data: Partial<CreateOrganizationDto>) {
    const existing = await this.prisma.organization.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Organización con ID ${id} no encontrada`);
    }

    if (data.enabledModules) {
      this.assertValidModules(data.enabledModules);
    }

    return this.prisma.organization.update({
      where: { id },
      data,
      include: { businessType: true },
    });
  }

  async updateForPlatform(id: string, data: UpdatePlatformOrganizationData) {
    const existing = await this.prisma.organization.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Organización con ID ${id} no encontrada`);
    }

    const targetBusinessTypeId = data.businessTypeId ?? existing.businessTypeId;
    const businessType = await this.prisma.businessType.findUnique({ where: { id: targetBusinessTypeId } });
    if (!businessType) {
      throw new BadRequestException('El tipo de negocio seleccionado no existe');
    }

    const changingBusinessType = targetBusinessTypeId !== existing.businessTypeId;
    const modulesToSave = data.enabledModules ?? (changingBusinessType ? businessType.defaultModules as string[] : undefined);
    if (modulesToSave !== undefined) this.validateEnabledModules(modulesToSave, businessType);

    const { ownerEmail, ...organizationData } = data;
    if (modulesToSave !== undefined) organizationData.enabledModules = modulesToSave;
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

  private assertValidModules(enabledModules: string[]) {
    if (!this.moduleCatalogService.isValidKeys(enabledModules)) {
      throw new BadRequestException(
        "Uno o más módulos no existen en el catálogo",
      );
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.organization.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Organización con ID ${id} no encontrada`);
    }

    return this.prisma.organization.delete({
      where: { id },
    });
  }

<<<<<<< HEAD
  private validateEnabledModules(enabledModules: string[], businessType: { name: string; availableModules: unknown }) {
    const availableModules = Array.isArray(businessType.availableModules)
      ? businessType.availableModules.filter((module): module is string => typeof module === 'string')
      : [];
    const invalidModules = enabledModules.filter((module) => !availableModules.includes(module));
    if (invalidModules.length) {
      throw new BadRequestException(`Estos módulos no están disponibles para ${businessType.name}: ${invalidModules.join(', ')}`);
    }
=======
  // ==========================================
  // FASE 4: Suspensión de organizaciones (moderación de plataforma)
  // ==========================================

  /**
   * Suspender una organización - Solo PLATFORM_ADMIN
   * La suspensión surte efecto inmediato porque TenantGuard verifica el status en cada request
   */
  async suspendOrganization(id: string) {
    const existing = await this.prisma.organization.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Organización con ID ${id} no encontrada`);
    }

    return this.prisma.organization.update({
      where: { id },
      data: { status: "SUSPENDED" },
      include: { businessType: true },
    });
  }

  /**
   * Reactivar una organización suspendida - Solo PLATFORM_ADMIN
   */
  async reactivateOrganization(id: string) {
    const existing = await this.prisma.organization.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Organización con ID ${id} no encontrada`);
    }

    return this.prisma.organization.update({
      where: { id },
      data: { status: "ACTIVE" },
      include: { businessType: true },
    });
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540
  }
}
