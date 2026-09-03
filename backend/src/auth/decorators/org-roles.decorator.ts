import { SetMetadata } from '@nestjs/common';
import { OrgRole, PlatformRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const ORG_ROLES_KEY = 'orgRoles';
export const PLATFORM_ROLES_KEY = 'platformRoles';

export const OrgRoles = (...roles: OrgRole[]) => SetMetadata(ORG_ROLES_KEY, roles);

export const PlatformRoles = (...roles: PlatformRole[]) => SetMetadata(PLATFORM_ROLES_KEY, roles);
