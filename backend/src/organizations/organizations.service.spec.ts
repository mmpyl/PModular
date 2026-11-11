import { BadRequestException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsService', () => {
  it('returns the business type after updating organization settings', async () => {
    const organization = { id: 'organization-id', businessType: { name: 'Bodega' } };
    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({ id: organization.id }),
        update: jest.fn().mockResolvedValue(organization),
      },
    };
    const service = new OrganizationsService(prisma as any);

    const result = await service.update(organization.id, { settings: {} });

    expect(prisma.organization.update).toHaveBeenCalledWith({
      where: { id: organization.id },
      data: { settings: {} },
      include: { businessType: true },
    });
    expect(result.businessType.name).toBe('Bodega');
  });

  it('rejects Platform module assignments that are unavailable for the business type', async () => {
    const prisma = {
      businessType: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'type-id',
          name: 'Ferretería',
          defaultModules: ['inventario', 'ventas'],
          availableModules: ['inventario', 'ventas', 'compras'],
        }),
      },
      user: { findUnique: jest.fn().mockResolvedValue({ id: 'owner-id', platformRole: null }) },
      $transaction: jest.fn(),
    };
    const service = new OrganizationsService(prisma as any);

    await expect(service.createForPlatform({
      name: 'Ferretería de prueba',
      businessTypeId: 'type-id',
      ownerEmail: 'owner@example.test',
      enabledModules: ['caja'],
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});