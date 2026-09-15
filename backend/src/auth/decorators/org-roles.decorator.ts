import { SetMetadata } from '@nestjs/common';
import { OrgRole, PlatformRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const ORG_ROLES_KEY = 'orgRoles';
export const PLATFORM_ROLES_KEY = 'platformRoles';

/**
 * Constante para evitar hardcodeo de roles en decoradores.
 * Facilita cambios futuros y centraliza la definición de roles permitidos.
 */
export const ALLOWED_PLATFORM_ROLES = [PlatformRole.PLATFORM_ADMIN, PlatformRole.SUPPORT] as const;

export const OrgRoles = (...roles: OrgRole[]) => SetMetadata(ORG_ROLES_KEY, roles);

export const PlatformRoles = (...roles: PlatformRole[]) => SetMetadata(PLATFORM_ROLES_KEY, roles);
