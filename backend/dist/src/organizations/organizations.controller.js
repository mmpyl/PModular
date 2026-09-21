"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformOrganizationsController = exports.OrganizationsController = void 0;
const common_1 = require("@nestjs/common");
const organizations_service_1 = require("./organizations.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../auth/guards/tenant.guard");
const org_roles_guard_1 = require("../auth/guards/org-roles.guard");
const org_roles_decorator_1 = require("../auth/decorators/org-roles.decorator");
const current_org_decorator_1 = require("../auth/decorators/current-org.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const platform_roles_guard_1 = require("../auth/guards/platform-roles.guard");
const audit_log_interceptor_1 = require("../audit-log/audit-log.interceptor");
const client_1 = require("@prisma/client");
let OrganizationsController = class OrganizationsController {
    constructor(organizationsService) {
        this.organizationsService = organizationsService;
    }
    create(createOrgDto, user) {
        return this.organizationsService.create(createOrgDto, user.sub);
    }
    findAll(organizationId) {
        return this.organizationsService.findAll(organizationId);
    }
    findOne(id, organizationId) {
        if (id !== organizationId) {
            throw new common_1.ForbiddenException('No tienes acceso a esta organización');
        }
        return this.organizationsService.findOne(id);
    }
    update(id, updateOrgDto, organizationId) {
        if (id !== organizationId) {
            throw new common_1.ForbiddenException('No puedes editar otra organización');
        }
        return this.organizationsService.update(id, updateOrgDto);
    }
    remove(id, organizationId) {
        if (id !== organizationId) {
            throw new common_1.ForbiddenException('No puedes eliminar una organización que no te pertenece');
        }
        return this.organizationsService.remove(id);
    }
};
exports.OrganizationsController = OrganizationsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __param(0, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard, org_roles_guard_1.OrgRolesGuard),
    (0, org_roles_decorator_1.OrgRoles)('OWNER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard, org_roles_guard_1.OrgRolesGuard),
    (0, org_roles_decorator_1.OrgRoles)('OWNER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], OrganizationsController.prototype, "remove", null);
exports.OrganizationsController = OrganizationsController = __decorate([
    (0, common_1.Controller)('organizations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [organizations_service_1.OrganizationsService])
], OrganizationsController);
let PlatformOrganizationsController = class PlatformOrganizationsController {
    constructor(organizationsService) {
        this.organizationsService = organizationsService;
    }
    async suspend(id) {
        return this.organizationsService.suspendOrganization(id);
    }
    async reactivate(id) {
        return this.organizationsService.reactivateOrganization(id);
    }
};
exports.PlatformOrganizationsController = PlatformOrganizationsController;
__decorate([
    (0, common_1.Patch)(':id/suspend'),
    (0, org_roles_decorator_1.PlatformRoles)('PLATFORM_ADMIN'),
    (0, audit_log_interceptor_1.AuditAction)(client_1.AuditActionType.ORGANIZATION_SUSPENDED),
    (0, audit_log_interceptor_1.AuditEntityType)('Organization'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PlatformOrganizationsController.prototype, "suspend", null);
__decorate([
    (0, common_1.Patch)(':id/reactivate'),
    (0, org_roles_decorator_1.PlatformRoles)('PLATFORM_ADMIN'),
    (0, audit_log_interceptor_1.AuditAction)(client_1.AuditActionType.ORGANIZATION_REACTIVATED),
    (0, audit_log_interceptor_1.AuditEntityType)('Organization'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PlatformOrganizationsController.prototype, "reactivate", null);
exports.PlatformOrganizationsController = PlatformOrganizationsController = __decorate([
    (0, common_1.Controller)('platform/organizations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, platform_roles_guard_1.PlatformRolesGuard),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    __metadata("design:paramtypes", [organizations_service_1.OrganizationsService])
], PlatformOrganizationsController);
//# sourceMappingURL=organizations.controller.js.map