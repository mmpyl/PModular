import { SetMetadata } from '@nestjs/common';
import { Role, OrgRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const ORG_ROLES_KEY = 'orgRoles';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
export const OrgRoles = (...roles: OrgRole[]) => SetMetadata(ORG_ROLES_KEY, roles);
