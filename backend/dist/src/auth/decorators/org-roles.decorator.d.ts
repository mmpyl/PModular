import { OrgRole, PlatformRole } from '@prisma/client';
export declare const ROLES_KEY = "roles";
export declare const ORG_ROLES_KEY = "orgRoles";
export declare const PLATFORM_ROLES_KEY = "platformRoles";
export declare const ALLOWED_PLATFORM_ROLES: readonly ["PLATFORM_ADMIN", "SUPPORT"];
export declare const OrgRoles: (...roles: OrgRole[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const PlatformRoles: (...roles: PlatformRole[]) => import("@nestjs/common").CustomDecorator<string>;
