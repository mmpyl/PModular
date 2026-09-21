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
exports.MembershipsController = void 0;
const common_1 = require("@nestjs/common");
const memberships_service_1 = require("./memberships.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../auth/guards/tenant.guard");
const org_roles_guard_1 = require("../auth/guards/org-roles.guard");
const org_roles_decorator_1 = require("../auth/decorators/org-roles.decorator");
const current_org_decorator_1 = require("../auth/decorators/current-org.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const audit_log_interceptor_1 = require("../audit-log/audit-log.interceptor");
const client_2 = require("@prisma/client");
let MembershipsController = class MembershipsController {
    constructor(membershipsService) {
        this.membershipsService = membershipsService;
    }
    create(createMembershipDto, organizationId) {
        if (createMembershipDto.organizationId !== organizationId) {
            throw new common_1.ForbiddenException('No puedes crear membresías para otra organización');
        }
        return this.membershipsService.create(createMembershipDto);
    }
    findByUser(userId, user) {
        if (userId !== user.sub && !user.platformRole) {
            throw new common_1.ForbiddenException('No tienes acceso a las membresías de otro usuario');
        }
        return this.membershipsService.findByUser(userId);
    }
    findByOrganization(organizationId, currentOrgId) {
        if (organizationId !== currentOrgId) {
            throw new common_1.ForbiddenException('No tienes acceso a los miembros de esta organización');
        }
        return this.membershipsService.findByOrganization(organizationId);
    }
    findOne(userId, organizationId, currentOrgId) {
        if (organizationId !== currentOrgId) {
            throw new common_1.ForbiddenException('No tienes acceso a este miembro');
        }
        return this.membershipsService.findOne(userId, organizationId);
    }
    remove(userId, organizationId, currentOrgId) {
        if (organizationId !== currentOrgId) {
            throw new common_1.ForbiddenException('No puedes eliminar membresías de otra organización');
        }
        return this.membershipsService.remove(userId, organizationId);
    }
    updateRole(userId, organizationId, currentOrgId, role) {
        if (organizationId !== currentOrgId) {
            throw new common_1.ForbiddenException('No puedes actualizar roles de otra organización');
        }
        return this.membershipsService.updateRole(userId, organizationId, role);
    }
};
exports.MembershipsController = MembershipsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard, org_roles_guard_1.OrgRolesGuard),
    (0, org_roles_decorator_1.OrgRoles)('OWNER'),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    (0, audit_log_interceptor_1.AuditAction)(client_2.AuditActionType.MEMBER_ADDED),
    (0, audit_log_interceptor_1.AuditEntityType)('Membership'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "findByUser", null);
__decorate([
    (0, common_1.Get)('organization/:organizationId'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard, org_roles_guard_1.OrgRolesGuard),
    __param(0, (0, common_1.Param)('organizationId')),
    __param(1, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "findByOrganization", null);
__decorate([
    (0, common_1.Get)('member/:userId/:organizationId'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard, org_roles_guard_1.OrgRolesGuard),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('organizationId')),
    __param(2, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':userId/:organizationId'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard, org_roles_guard_1.OrgRolesGuard),
    (0, org_roles_decorator_1.OrgRoles)('OWNER'),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    (0, audit_log_interceptor_1.AuditAction)(client_2.AuditActionType.MEMBER_REMOVED),
    (0, audit_log_interceptor_1.AuditEntityType)('Membership'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('organizationId')),
    __param(2, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':userId/:organizationId'),
    (0, common_1.UseGuards)(tenant_guard_1.TenantGuard, org_roles_guard_1.OrgRolesGuard),
    (0, org_roles_decorator_1.OrgRoles)('OWNER'),
    (0, common_1.UseInterceptors)(audit_log_interceptor_1.AuditLogInterceptor),
    (0, audit_log_interceptor_1.AuditAction)(client_2.AuditActionType.MEMBER_ROLE_CHANGED),
    (0, audit_log_interceptor_1.AuditEntityType)('Membership'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('organizationId')),
    __param(2, (0, current_org_decorator_1.CurrentOrg)()),
    __param(3, (0, common_1.Body)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "updateRole", null);
exports.MembershipsController = MembershipsController = __decorate([
    (0, common_1.Controller)('memberships'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [memberships_service_1.MembershipsService])
], MembershipsController);
//# sourceMappingURL=memberships.controller.js.map