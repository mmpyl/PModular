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
exports.BusinessEntitiesController = void 0;
const common_1 = require("@nestjs/common");
const business_entities_service_1 = require("./business-entities.service");
const create_business_entity_dto_1 = require("./dto/create-business-entity.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../auth/guards/tenant.guard");
const org_roles_guard_1 = require("../auth/guards/org-roles.guard");
const org_roles_decorator_1 = require("../auth/decorators/org-roles.decorator");
const current_org_decorator_1 = require("../auth/decorators/current-org.decorator");
let BusinessEntitiesController = class BusinessEntitiesController {
    constructor(businessEntitiesService) {
        this.businessEntitiesService = businessEntitiesService;
    }
    create(dto, orgId) {
        return this.businessEntitiesService.create(orgId, dto);
    }
    findAll(orgId, entityType, search) {
        return this.businessEntitiesService.findAll(orgId, entityType, search);
    }
    findOne(id, orgId) {
        return this.businessEntitiesService.findOne(orgId, id);
    }
    findOneWithHistory(id, orgId) {
        return this.businessEntitiesService.findOneWithHistory(orgId, id);
    }
    recalculateBalance(id, orgId) {
        return this.businessEntitiesService.recalculateBalance(orgId, id);
    }
    checkCreditLimit(id, orgId) {
        return this.businessEntitiesService.checkCreditLimit(orgId, id);
    }
    update(id, dto, orgId) {
        return this.businessEntitiesService.update(orgId, id, dto);
    }
    remove(id, orgId) {
        return this.businessEntitiesService.remove(orgId, id);
    }
};
exports.BusinessEntitiesController = BusinessEntitiesController;
__decorate([
    (0, common_1.Post)(),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_business_entity_dto_1.CreateBusinessEntityDto, String]),
    __metadata("design:returntype", void 0)
], BusinessEntitiesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'VENDEDOR', 'INVENTARIO'),
    __param(0, (0, current_org_decorator_1.CurrentOrg)()),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], BusinessEntitiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'VENDEDOR', 'INVENTARIO'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], BusinessEntitiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'VENDEDOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], BusinessEntitiesController.prototype, "findOneWithHistory", null);
__decorate([
    (0, common_1.Post)(':id/recalculate-balance'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], BusinessEntitiesController.prototype, "recalculateBalance", null);
__decorate([
    (0, common_1.Get)(':id/check-credit-limit'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'VENDEDOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], BusinessEntitiesController.prototype, "checkCreditLimit", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_business_entity_dto_1.UpdateBusinessEntityDto, String]),
    __metadata("design:returntype", void 0)
], BusinessEntitiesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], BusinessEntitiesController.prototype, "remove", null);
exports.BusinessEntitiesController = BusinessEntitiesController = __decorate([
    (0, common_1.Controller)('business-entities'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, org_roles_guard_1.OrgRolesGuard),
    __metadata("design:paramtypes", [business_entities_service_1.BusinessEntitiesService])
], BusinessEntitiesController);
//# sourceMappingURL=business-entities.controller.js.map