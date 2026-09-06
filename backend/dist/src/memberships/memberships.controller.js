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
let MembershipsController = class MembershipsController {
    constructor(membershipsService) {
        this.membershipsService = membershipsService;
    }
    create(createMembershipDto, organizationId) {
        if (createMembershipDto.organizationId !== organizationId) {
            throw new Error('No puedes crear membresías para otra organización');
        }
        return this.membershipsService.create(createMembershipDto);
    }
    findByUser(userId) {
        return this.membershipsService.findByUser(userId);
    }
    findByOrganization(organizationId, currentOrgId) {
        if (organizationId !== currentOrgId) {
            throw new Error('No tienes acceso a los miembros de esta organización');
        }
        return this.membershipsService.findByOrganization(organizationId);
    }
    findOne(userId, organizationId, currentOrgId) {
        if (organizationId !== currentOrgId) {
            throw new Error('No tienes acceso a este miembro');
        }
        return this.membershipsService.findOne(userId, organizationId);
    }
    remove(userId, organizationId, currentOrgId) {
        if (organizationId !== currentOrgId) {
            throw new Error('No puedes eliminar membresías de otra organización');
        }
        return this.membershipsService.remove(userId, organizationId);
    }
};
exports.MembershipsController = MembershipsController;
__decorate([
    (0, common_1.Post)(),
    (0, org_roles_decorator_1.OrgRoles)('OWNER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "findByUser", null);
__decorate([
    (0, common_1.Get)('organization/:organizationId'),
    __param(0, (0, common_1.Param)('organizationId')),
    __param(1, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "findByOrganization", null);
__decorate([
    (0, common_1.Get)('member/:userId/:organizationId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('organizationId')),
    __param(2, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':userId/:organizationId'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('organizationId')),
    __param(2, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], MembershipsController.prototype, "remove", null);
exports.MembershipsController = MembershipsController = __decorate([
    (0, common_1.Controller)('memberships'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, org_roles_guard_1.OrgRolesGuard),
    __metadata("design:paramtypes", [memberships_service_1.MembershipsService])
], MembershipsController);
//# sourceMappingURL=memberships.controller.js.map