import { SetMetadata, createParamDecorator } from '@nestjs/common';
import { OrgRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const ORG_ROLES_KEY = 'orgRoles';

export const OrgRoles = (...roles: OrgRole[]) => SetMetadata(ORG_ROLES_KEY, roles);

export const CurrentOrg = createParamDecorator((data: unknown, ctx) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user?.organizationId;
});

export const CurrentUser = createParamDecorator((data: unknown, ctx) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
