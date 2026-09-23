import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrganizationFiscalSettingsDto, UpdateOrganizationFiscalSettingsDto } from './dto/organization-fiscal-settings.dto';

@Injectable()
export class OrganizationFiscalSettingsService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateOrganizationFiscalSettingsDto) {
    // Verificar si ya existe configuración para esta organización
    const existing = await this.prisma.organizationFiscalSettings.findUnique({
      where: { organizationId },
    });

    if (existing) {
      throw new Error('La organización ya tiene configuración fiscal registrada');
    }

    // Validar que la organización exista
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organización no encontrada');
    }

    return this.prisma.organizationFiscalSettings.create({
      data: {
        ...dto,
        organizationId,
        isConfigured: this.checkIsConfigured(dto),
      },
      include: {
        organization: true,
      },
    });
  }

  async findByOrganization(organizationId: string) {
    const settings = await this.prisma.organizationFiscalSettings.findUnique({
      where: { organizationId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            businessTypeId: true,
          },
        },
      },
    });

    if (!settings) {
      return null;
    }

    return settings;
  }

  async update(organizationId: string, dto: UpdateOrganizationFiscalSettingsDto) {
    const existing = await this.prisma.organizationFiscalSettings.findUnique({
      where: { organizationId },
    });

    if (!existing) {
      throw new NotFoundException('Configuración fiscal no encontrada para esta organización');
    }

    // Combinar datos existentes con nuevos
    const updatedData = { ...existing, ...dto };

    return this.prisma.organizationFiscalSettings.update({
      where: { organizationId },
      data: {
        ...dto,
        isConfigured: this.checkIsConfigured(updatedData),
      },
      include: {
        organization: true,
      },
    });
  }

  async upsert(organizationId: string, dto: CreateOrganizationFiscalSettingsDto & Partial<UpdateOrganizationFiscalSettingsDto>) {
    const existing = await this.prisma.organizationFiscalSettings.findUnique({
      where: { organizationId },
    });

    if (existing) {
      return this.update(organizationId, dto as UpdateOrganizationFiscalSettingsDto);
    }

    return this.create(organizationId, dto as CreateOrganizationFiscalSettingsDto);
  }

  /**
   * Obtiene el siguiente correlativo para un tipo de comprobante y serie
   */
  async getNextCorrelativo(organizationId: string, tipoComprobante: string, serie: string): Promise<string> {
    const settings = await this.prisma.organizationFiscalSettings.findUnique({
      where: { organizationId },
    });

    if (!settings) {
      throw new NotFoundException('Configuración fiscal no encontrada');
    }

    const ultimosCorrelativos = settings.ultimosCorrelativos as Record<string, number> || {};
    const key = `${serie}`;
    
    const currentCorrelativo = ultimosCorrelativos[key] || 0;
    const nextCorrelativo = currentCorrelativo + 1;

    // Actualizar el último correlativo usado
    ultimosCorrelativos[key] = nextCorrelativo;

    await this.prisma.organizationFiscalSettings.update({
      where: { organizationId },
      data: {
        ultimosCorrelativos,
      },
    });

    // Retornar correlativo con ceros a la izquierda (8 dígitos)
    return nextCorrelativo.toString().padStart(8, '0');
  }

  /**
   * Valida si la configuración fiscal está completa
   */
  private checkIsConfigured(settings: any): boolean {
    const requiredFields = [
      'ruc',
      'razonSocial',
      'direccion',
      'ubige',
      'departamento',
      'provincia',
      'distrito',
    ];

    return requiredFields.every(field => settings[field] && settings[field].trim() !== '');
  }

  /**
   * Elimina la configuración fiscal de una organización
   */
  async delete(organizationId: string) {
    const existing = await this.prisma.organizationFiscalSettings.findUnique({
      where: { organizationId },
    });

    if (!existing) {
      throw new NotFoundException('Configuración fiscal no encontrada para esta organización');
    }

    return this.prisma.organizationFiscalSettings.delete({
      where: { organizationId },
    });
  }
}
