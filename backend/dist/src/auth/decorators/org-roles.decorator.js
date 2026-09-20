"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformRoles = exports.OrgRoles = exports.ALLOWED_PLATFORM_ROLES = exports.PLATFORM_ROLES_KEY = exports.ORG_ROLES_KEY = exports.ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
exports.ROLES_KEY = 'roles';
exports.ORG_ROLES_KEY = 'orgRoles';
exports.PLATFORM_ROLES_KEY = 'platformRoles';
exports.ALLOWED_PLATFORM_ROLES = [client_1.PlatformRole.PLATFORM_ADMIN, client_1.PlatformRole.SUPPORT];
const OrgRoles = (...roles) => (0, common_1.SetMetadata)(exports.ORG_ROLES_KEY, roles);
exports.OrgRoles = OrgRoles;
const PlatformRoles = (...roles) => (0, common_1.SetMetadata)(exports.PLATFORM_ROLES_KEY, roles);
exports.PlatformRoles = PlatformRoles;
//# sourceMappingURL=org-roles.decorator.js.map