import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { OrgRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const ORG_ROLES_KEY = 'orgRoles';

export const OrgRoles = (...roles: OrgRole[]) => SetMetadata(ORG_ROLES_KEY, roles);

/**
 * Decorador para obtener el ID de la organización desde el request
 * Uso: @CurrentOrg() orgId: string
 */
export const CurrentOrg = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.organizationId || request.headers['x-org-id'];
  },
);

/**
 * Decorador para obtener el usuario actual desde el request
 * Uso: @CurrentUser() user: any
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
