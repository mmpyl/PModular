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
exports.PlatformController = void 0;
const common_1 = require("@nestjs/common");
const platform_service_1 = require("./platform.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const platform_roles_guard_1 = require("../auth/guards/platform-roles.guard");
const org_roles_decorator_1 = require("../auth/decorators/org-roles.decorator");
const platform_pagination_query_dto_1 = require("./dto/platform-pagination-query.dto");
const update_platform_role_dto_1 = require("./dto/update-platform-role.dto");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let PlatformController = class PlatformController {
    constructor(platformService) {
        this.platformService = platformService;
    }
    async findOrganizations(query) {
        return this.platformService.findOrganizations(query);
    }
    async findOrganizationById(id) {
        return this.platformService.findOrganizationById(id);
    }
    async findUsers(query) {
        return this.platformService.findUsers(query);
    }
    async getMetrics() {
        return this.platformService.getMetrics();
    }
    async updatePlatformRole(userId, updateRoleDto, currentUser) {
        return this.platformService.updatePlatformRole(userId, currentUser.sub, updateRoleDto.role ?? null);
    }
};
exports.PlatformController = PlatformController;
__decorate([
    (0, common_1.Get)('organizations'),
    (0, org_roles_decorator_1.PlatformRoles)(...org_roles_decorator_1.ALLOWED_PLATFORM_ROLES),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [platform_pagination_query_dto_1.PlatformPaginationQueryDto]),
    __metadata("design:returntype", Promise)
], PlatformController.prototype, "findOrganizations", null);
__decorate([
    (0, common_1.Get)('organizations/:id'),
    (0, org_roles_decorator_1.PlatformRoles)(...org_roles_decorator_1.ALLOWED_PLATFORM_ROLES),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PlatformController.prototype, "findOrganizationById", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, org_roles_decorator_1.PlatformRoles)(...org_roles_decorator_1.ALLOWED_PLATFORM_ROLES),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [platform_pagination_query_dto_1.PlatformPaginationQueryDto]),
    __metadata("design:returntype", Promise)
], PlatformController.prototype, "findUsers", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, org_roles_decorator_1.PlatformRoles)(...org_roles_decorator_1.ALLOWED_PLATFORM_ROLES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PlatformController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Patch)('users/:id/role'),
    (0, org_roles_decorator_1.PlatformRoles)(client_1.PlatformRole.PLATFORM_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_platform_role_dto_1.UpdatePlatformRoleDto, Object]),
    __metadata("design:returntype", Promise)
], PlatformController.prototype, "updatePlatformRole", null);
exports.PlatformController = PlatformController = __decorate([
    (0, common_1.Controller)('platform'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, platform_roles_guard_1.PlatformRolesGuard),
    __metadata("design:paramtypes", [platform_service_1.PlatformService])
], PlatformController);
//# sourceMappingURL=platform.controller.js.map