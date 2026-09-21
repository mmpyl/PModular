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
exports.SalesController = void 0;
const common_1 = require("@nestjs/common");
const sales_service_1 = require("./sales.service");
const create_sale_dto_1 = require("./dto/create-sale.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../auth/guards/tenant.guard");
const org_roles_guard_1 = require("../auth/guards/org-roles.guard");
const org_roles_decorator_1 = require("../auth/decorators/org-roles.decorator");
const current_org_decorator_1 = require("../auth/decorators/current-org.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let SalesController = class SalesController {
    constructor(salesService) {
        this.salesService = salesService;
    }
    create(dto, orgId, user) {
        return this.salesService.create(orgId, user.sub, dto);
    }
    findAll(orgId, status, customerId) {
        return this.salesService.findAll(orgId, status, customerId);
    }
    findOne(id, orgId) {
        return this.salesService.findOne(orgId, id);
    }
    update(id, dto, orgId) {
        return this.salesService.update(orgId, id, dto);
    }
    complete(id, orgId, user) {
        return this.salesService.complete(orgId, user.sub, id);
    }
    processPayment(id, dto, orgId, user) {
        return this.salesService.processPayment(orgId, user.sub, id, dto);
    }
    cancel(id, orgId) {
        return this.salesService.cancel(orgId, id);
    }
    remove(id, orgId) {
        return this.salesService.remove(orgId, id);
    }
};
exports.SalesController = SalesController;
__decorate([
    (0, common_1.Post)(),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'VENDEDOR', 'CAJA'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_org_decorator_1.CurrentOrg)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_sale_dto_1.CreateSaleDto, String, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'VENDEDOR', 'INVENTARIO', 'CAJA'),
    __param(0, (0, current_org_decorator_1.CurrentOrg)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'VENDEDOR', 'INVENTARIO', 'CAJA'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'VENDEDOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_sale_dto_1.UpdateSaleDto, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'VENDEDOR', 'CAJA'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_org_decorator_1.CurrentOrg)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)(':id/payment'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'VENDEDOR', 'CAJA'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_org_decorator_1.CurrentOrg)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_sale_dto_1.ProcessPaymentDto, String, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "processPayment", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "cancel", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "remove", null);
exports.SalesController = SalesController = __decorate([
    (0, common_1.Controller)('sales'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, org_roles_guard_1.OrgRolesGuard),
    __metadata("design:paramtypes", [sales_service_1.SalesService])
], SalesController);
//# sourceMappingURL=sales.controller.js.map