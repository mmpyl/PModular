import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrganizationFiscalSettingsService } from './organization-fiscal-settings.service';

/**
 * Configuración fiscal de la organización (base de la facturación electrónica).
 * Reglas clave:
 *  - Errores esperados como excepciones HTTP (409/404), nunca `throw new Error` (500).
 *  - Secretos (claves PSE / contraseña y contenido del certificado) cifrados en reposo,
 *    enmascarados en las respuestas y re-cifrados de forma transparente si llegan
 *    heredados en texto plano.
 */
describe('OrganizationFiscalSettingsService', () => {
  const ORG = 'org-1';
  let prisma: any;
  let service: OrganizationFiscalSettingsService;

  beforeEach(() => {
    process.env.FISCAL_SECRETS_KEY = 'test-key-para-cifrado-unitario';

    prisma = {
      organizationFiscalSettings: {
        findUnique: jest.fn(),
        create: jest.fn(async ({ data }: any) => ({ id: 'fs-1', ...data })),
        update: jest.fn(async ({ data }: any) => ({ id: 'fs-1', ...data })),
        delete: jest.fn(async () => ({ id: 'fs-1' })),
      },
      organization: {
        findUnique: jest.fn().mockResolvedValue({ id: ORG, name: 'ACME' }),
      },
    };
    service = new OrganizationFiscalSettingsService(prisma as unknown as PrismaService);
  });

  describe('create()', () => {
    it('lanza ConflictException (409), no un Error genérico (500), si ya existe configuración', async () => {
      prisma.organizationFiscalSettings.findUnique.mockResolvedValue({ id: 'fs-1' });

      await expect(service.create(ORG, {} as any)).rejects.toThrow(ConflictException);
      // Garantía explícita: NO debe ser un Error plano (que el filtro global traduce a 500).
      await service.create(ORG, {} as any).catch((e) => {
        expect(e.constructor.name).toBe('ConflictException');
        expect(e.getStatus()).toBe(409);
      });
    });

    it('lanza NotFoundException (404) si la organización no existe', async () => {
      prisma.organizationFiscalSettings.findUnique.mockResolvedValue(null);
      prisma.organization.findUnique.mockResolvedValue(null);

      await expect(service.create(ORG, {} as any)).rejects.toThrow(NotFoundException);
    });

    it('cifra los secretos antes de persistirlos y nunca los devuelve en claro', async () => {
      prisma.organizationFiscalSettings.findUnique.mockResolvedValue(null);

      const result = await service.create(ORG, {
        ruc: '20512345679',
        razonSocial: 'ACME EIRL',
        direccion: 'Av. Siempre 123',
        ubigeo: '150101',
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: 'Lima',
        psePassword: 'SuperSecreta123',
        certificadoPassword: 'CertPass!',
      } as any);

      const stored = prisma.organizationFiscalSettings.create.mock.calls[0][0].data;
      expect(stored.psePassword).not.toBe('SuperSecreta123');
      expect(stored.psePassword).toMatch(/^enc:v1:/);
      expect(stored.certificadoPassword).toMatch(/^enc:v1:/);

      // Respuesta saneada: enmascarada, sin el secreto real.
      expect(result.psePassword).not.toContain('SuperSecreta123');
      expect(result.psePassword).toContain('•');
      expect(result.certificadoPassword).toContain('•');
    });

    it('marca isConfigured=true solo con los campos fiscales obligatorios completos', async () => {
      prisma.organizationFiscalSettings.findUnique.mockResolvedValue(null);

      const incomplete = await service.create(ORG, { ruc: '20512345679' } as any);
      expect(incomplete.isConfigured).toBe(false);

      const complete = await service.create(ORG, {
        ruc: '20512345679',
        razonSocial: 'ACME EIRL',
        direccion: 'Av. Siempre 123',
        ubigeo: '150101',
        departamento: 'Lima',
        provincia: 'Lima',
        distrito: 'Lima',
      } as any);
      expect(complete.isConfigured).toBe(true);
    });
  });

  describe('findByOrganization() — sanitización de secretos', () => {
    it('re-cifra en reposo los secretos heredados en texto plano y devuelve valores enmascarados', async () => {
      prisma.organizationFiscalSettings.findUnique.mockResolvedValue({
        organizationId: ORG,
        psePassword: 'legado-en-plano',
        certificadoPassword: 'enc:v1:aa:bb:cc',
        certificadoDigital: null,
      });

      const result = await service.findByOrganization(ORG);

      // Se persistió la versión cifrada del secreto heredado.
      expect(prisma.organizationFiscalSettings.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: ORG },
          data: expect.objectContaining({ psePassword: expect.stringMatching(/^enc:v1:/) }),
        }),
      );
      expect(result.psePassword).toContain('•');
      expect(result.certificadoPassword).toContain('•');
      expect(result.hasCertificadoDigital).toBe(false);
    });

    it('omite el contenido del certificado y solo expone hasCertificadoDigital', async () => {
      prisma.organizationFiscalSettings.findUnique.mockResolvedValue({
        organizationId: ORG,
        psePassword: null,
        certificadoPassword: null,
        certificadoDigital: 'BASE64-PFX-EN-CLARO',
      });

      const result = await service.findByOrganization(ORG);

      expect(result.certificadoDigital).toBeUndefined();
      expect(result.hasCertificadoDigital).toBe(true);
      // El certificado también queda cifrado en reposo.
      const updateCall = prisma.organizationFiscalSettings.update.mock.calls[0][0];
      expect(updateCall.data.certificadoDigital).toMatch(/^enc:v1:/);
    });
  });

  describe('update()', () => {
    it('lanza NotFoundException si no hay configuración que actualizar', async () => {
      prisma.organizationFiscalSettings.findUnique.mockResolvedValue(null);
      await expect(service.update(ORG, {} as any)).rejects.toThrow(NotFoundException);
    });

    it('ignora valores enmascarados reenviados por el cliente (no sobreescribe el secreto)', async () => {
      prisma.organizationFiscalSettings.findUnique.mockResolvedValue({
        organizationId: ORG,
        psePassword: 'enc:v1:aa:bb:cc',
        ruc: '20512345679',
      });

      await service.update(ORG, { razonSocial: 'Nueva Razón', psePassword: '••••••••' } as any);

      const data = prisma.organizationFiscalSettings.update.mock.calls[0][0].data;
      expect(data.psePassword).toBeUndefined();
      expect(data.razonSocial).toBe('Nueva Razón');
    });
  });

  describe('getRawForInternalUse()', () => {
    it('descifra los secretos solo para uso interno (PSE/firma)', async () => {
      const encrypted = require('../common/crypto').encryptSecret('ClavePSE');
      prisma.organizationFiscalSettings.findUnique.mockResolvedValue({
        organizationId: ORG,
        psePassword: encrypted,
        certificadoPassword: null,
        certificadoDigital: null,
      });

      const raw = await service.getRawForInternalUse(ORG);
      expect(raw?.psePassword).toBe('ClavePSE');
    });
  });

  describe('delete()', () => {
    it('lanza NotFoundException si no existe configuración', async () => {
      prisma.organizationFiscalSettings.findUnique.mockResolvedValue(null);
      await expect(service.delete(ORG)).rejects.toThrow(NotFoundException);
    });

    it('elimina cuando existe', async () => {
      prisma.organizationFiscalSettings.findUnique.mockResolvedValue({ id: 'fs-1' });
      await expect(service.delete(ORG)).resolves.toEqual({ id: 'fs-1' });
    });
  });
});
