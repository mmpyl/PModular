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
exports.ProductsController = void 0;
const common_1 = require("@nestjs/common");
const products_service_1 = require("./products.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../auth/guards/tenant.guard");
const org_roles_guard_1 = require("../auth/guards/org-roles.guard");
const org_roles_decorator_1 = require("../auth/decorators/org-roles.decorator");
const current_org_decorator_1 = require("../auth/decorators/current-org.decorator");
let ProductsController = class ProductsController {
    constructor(productsService) {
        this.productsService = productsService;
    }
    create(createProductDto, organizationId) {
        return this.productsService.create(organizationId, createProductDto);
    }
    findAll(organizationId, categoryId, search) {
        return this.productsService.findAll(organizationId, { categoryId, search });
    }
    findOne(id, organizationId) {
        return this.productsService.findOne(organizationId, id);
    }
    update(id, updateProductDto, organizationId) {
        return this.productsService.update(organizationId, id, updateProductDto);
    }
    remove(id, organizationId) {
        return this.productsService.remove(organizationId, id);
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, common_1.Post)(),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR'),
    __param(0, (0, current_org_decorator_1.CurrentOrg)()),
    __param(1, (0, common_1.Query)('categoryId')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "remove", null);
exports.ProductsController = ProductsController = __decorate([
    (0, common_1.Controller)('products'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, org_roles_guard_1.OrgRolesGuard),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map