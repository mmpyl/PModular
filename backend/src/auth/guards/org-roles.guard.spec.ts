import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrgRole, PlatformRole } from '@prisma/client';
import { ORG_ROLES_KEY } from '../decorators/org-roles.decorator';
import { JwtPayload } from '../jwt-payload.type';

describe('OrgRolesGuard', () => {
  let guard: any;
  let reflector: any;
  let context: any;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    // Import dynamically to avoid circular dependency issues in tests
    const { OrgRolesGuard } = require('./org-roles.guard');
    guard = new OrgRolesGuard(reflector);
    
    context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
      }),
    };
  });

  it('permite acceso cuando no hay roles requeridos', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    
    const result = guard.canActivate(context);
    
    expect(result).toBe(true);
  });

  it('permite acceso a PLATFORM_ADMIN sin importar el rol de org', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    context.switchToHttp().getRequest.mockReturnValue({
      user: { platformRole: 'PLATFORM_ADMIN', orgRole: 'VENDEDOR' },
    });
    
    const result = guard.canActivate(context);
    
    expect(result).toBe(true);
  });

  it('deniega acceso si el usuario no tiene orgRole', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    context.switchToHttp().getRequest.mockReturnValue({
      user: { orgRole: null },
    });
    
    const result = guard.canActivate(context);
    
    expect(result).toBe(false);
  });

  it('permite acceso si el usuario tiene el rol requerido', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    context.switchToHttp().getRequest.mockReturnValue({
      user: { orgRole: 'ADMIN' },
    });
    
    const result = guard.canActivate(context);
    
    expect(result).toBe(true);
  });

  it('deniega acceso si el usuario no tiene el rol requerido', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    context.switchToHttp().getRequest.mockReturnValue({
      user: { orgRole: 'VENDEDOR' },
    });
    
    const result = guard.canActivate(context);
    
    expect(result).toBe(false);
  });
});
