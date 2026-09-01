import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole } from '@prisma/client';
import { PLATFORM_ROLES_KEY } from '../decorators/org-roles.decorator';
import { JwtPayload } from '../jwt-payload.type';

/**
 * Guard para verificar roles de plataforma (acceso global fuera del contexto tenant)
 * Se usa en endpoints administrativos que no requieren contexto de organización
 */
@Injectable()
export class PlatformRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<PlatformRole[]>(PLATFORM_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const platformRole = request.user?.platformRole;
    
    if (!platformRole) {
      return false;
    }

    return requiredRoles.includes(platformRole);
  }
}
