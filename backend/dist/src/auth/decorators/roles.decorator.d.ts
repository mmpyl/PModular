import { OrgRole } from '@prisma/client';
export declare const ROLES_KEY = "roles";
export declare const ORG_ROLES_KEY = "orgRoles";
export declare const OrgRoles: (...roles: OrgRole[]) => import("@nestjs/common").CustomDecorator<string>;
