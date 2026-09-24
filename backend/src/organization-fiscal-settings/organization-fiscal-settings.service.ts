import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrganizationFiscalSettingsDto, UpdateOrganizationFiscalSettingsDto } from './dto/organization-fiscal-settings.dto';
import { encryptSecret, decryptSecret, isEncrypted, maskSecret } from '../common/crypto';

/** Campos que contienen secretos y nunca deben exponerse ni almacenarse en texto plano. */
const SECRET_FIELDS = ['psePassword', 'certificadoPassword'] as const;
/** Contenido del certificado digital (.pfx/.p12 base64): se cifra en reposo y se oculta en lecturas. */
const CERT_FIELD = 'certificadoDigital' as const;

@Injectable()
export class OrganizationFiscalSettingsService {
  constructor(private prisma: PrismaService) {}

  /** Cifra los secretos entrantes antes de persistirlos. */
  private sealSecrets<T extends Record<string, any>>(data: T): T {
    const out: Record<string, any> = { ...data };
    for (const field of [...SECRET_FIELDS, CERT_FIELD]) {
      const value = out[field];
      if (typeof value === 'string' && value.length > 0 && !isEncrypted(value)) {
        out[field] = encryptSecret(value);
      }
    }
    return out as T;
  }

  /**
   * Devuelve una copia segura para exponer por API:
   * - psePassword / certificadoPassword: enmascarados (nunca se devuelven).
   * - certificadoDigital: se omite el contenido (solo se indica si está configurado).
   * Los valores heredados en texto plano se re-cifran de forma transparente.
   */
  private async sanitize(settings: any): Promise<any> {
    if (!settings) return settings;
    const safe: Record<string, any> = { ...settings };

    for (const field of SECRET_FIELDS) {
      const value: string | null = safe[field] ?? null;
      if (value && !isEncrypted(value)) {
        await this.prisma.organizationFiscalSettings.update({
          where: { organizationId: settings.organizationId },
          data: { [field]: encryptSecret(value) },
        });
      }
      safe[field] = maskSecret(value);
    }

    if (safe[CERT_FIELD]) {
      if (!isEncrypted(safe[CERT_FIELD])) {
        await this.prisma.organizationFiscalSettings.update({
          where: { organizationId: settings.organizationId },
          data: { [CERT_FIELD]: encryptSecret(safe[CERT_FIELD]) },
        });
      }
      safe.hasCertificadoDigital = true;
      delete safe[CERT_FIELD];
    } else {
      safe.hasCertificadoDigital = false;
    }

    return safe;
  }

  /** Obtiene la configuración cruda con secretos descifrados — SOLO uso interno (PSE/firma). */
  async getRawForInternalUse(organizationId: string) {
    const settings = await this.prisma.organizationFiscalSettings.findUnique({
      where: { organizationId },
    });
    if (!settings) return null;
    return {
      ...settings,
      psePassword: settings.psePassword ? decryptSecret(settings.psePassword) : settings.psePassword,
      certificadoPassword: settings.certificadoPassword
        ? decryptSecret(settings.certificadoPassword)
        : settings.certificadoPassword,
      certificadoDigital: settings.certificadoDigital
        ? decryptSecret(settings.certificadoDigital)
        : settings.certificadoDigital,
    };
  }

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

    return this.sanitize(
      await this.prisma.organizationFiscalSettings.create({
        data: {
          ...this.sealSecrets(dto as Record<string, any>),
          organizationId,
          isConfigured: this.checkIsConfigured(dto),
        },
        include: {
          organization: true,
        },
      }),
    );
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

    return this.sanitize(settings);
  }

  async update(organizationId: string, dto: UpdateOrganizationFiscalSettingsDto) {
    const existing = await this.prisma.organizationFiscalSettings.findUnique({
      where: { organizationId },
    });

    if (!existing) {
      throw new NotFoundException('Configuración fiscal no encontrada para esta organización');
    }

    // Ignorar valores enmascarados reenviados por el cliente (evita sobreescribir
    // el secreto real con "••••••••" al guardar el formulario sin cambiarlo).
    const cleanDto: Record<string, any> = { ...dto };
    for (const field of [...SECRET_FIELDS, CERT_FIELD]) {
      if (typeof cleanDto[field] === 'string' && cleanDto[field].includes('•')) {
        delete cleanDto[field];
      }
    }

    // Combinar datos existentes con nuevos
    const updatedData = { ...existing, ...cleanDto };

    return this.sanitize(
      await this.prisma.organizationFiscalSettings.update({
        where: { organizationId },
        data: {
          ...this.sealSecrets(cleanDto),
          isConfigured: this.checkIsConfigured(updatedData),
        },
        include: {
          organization: true,
        },
      }),
    );
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
