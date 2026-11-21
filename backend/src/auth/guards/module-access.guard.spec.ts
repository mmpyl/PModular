import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_MODULES_KEY } from '../decorators/required-modules.decorator';
import { ModuleAccessGuard } from './module-access.guard';

describe('ModuleAccessGuard', () => {
  const handler = () => undefined;
  const controller = class {};
  const reflector = new Reflector();
  const request = { organizationId: 'organization-id' };
  const context = {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  it('allows requests when an enabled module is required', async () => {
    Reflect.defineMetadata(REQUIRED_MODULES_KEY, ['inventario', 'ventas'], handler);
    const prisma = { organization: { findUnique: jest.fn().mockResolvedValue({ enabledModules: ['ventas'] }) } };
    const guard = new ModuleAccessGuard(reflector, prisma as any);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('blocks requests when every required module is disabled', async () => {
    Reflect.defineMetadata(REQUIRED_MODULES_KEY, ['inventario'], handler);
    const prisma = { organization: { findUnique: jest.fn().mockResolvedValue({ enabledModules: ['ventas'] }) } };
    const guard = new ModuleAccessGuard(reflector, prisma as any);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });
});