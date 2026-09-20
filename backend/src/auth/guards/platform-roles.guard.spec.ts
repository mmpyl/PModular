import { PlatformRole } from '@prisma/client';

describe('PlatformRolesGuard', () => {
  let guard: any;
  let reflector: any;
  let context: any;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    const { PlatformRolesGuard } = require('./platform-roles.guard');
    guard = new PlatformRolesGuard(reflector);
    
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

  it('deniega acceso si el usuario no tiene platformRole', () => {
    reflector.getAllAndOverride.mockReturnValue(['PLATFORM_ADMIN']);
    context.switchToHttp().getRequest.mockReturnValue({
      user: { platformRole: null },
    });
    
    const result = guard.canActivate(context);
    
    expect(result).toBe(false);
  });

  it('permite acceso si el usuario tiene el rol de plataforma requerido', () => {
    reflector.getAllAndOverride.mockReturnValue(['PLATFORM_ADMIN']);
    context.switchToHttp().getRequest.mockReturnValue({
      user: { platformRole: 'PLATFORM_ADMIN' },
    });
    
    const result = guard.canActivate(context);
    
    expect(result).toBe(true);
  });

  it('deniega acceso si el usuario tiene un rol diferente al requerido', () => {
    reflector.getAllAndOverride.mockReturnValue(['PLATFORM_ADMIN']);
    context.switchToHttp().getRequest.mockReturnValue({
      user: { platformRole: 'SUPPORT' },
    });
    
    const result = guard.canActivate(context);
    
    expect(result).toBe(false);
  });

  it('permite acceso con múltiples roles requeridos si coincide uno', () => {
    reflector.getAllAndOverride.mockReturnValue(['PLATFORM_ADMIN', 'SUPPORT']);
    context.switchToHttp().getRequest.mockReturnValue({
      user: { platformRole: 'SUPPORT' },
    });
    
    const result = guard.canActivate(context);
    
    expect(result).toBe(true);
  });
});
