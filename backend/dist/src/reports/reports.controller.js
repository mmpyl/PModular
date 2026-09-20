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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
const tenant_guard_1 = require("../auth/guards/tenant.guard");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const org_roles_guard_1 = require("../auth/guards/org-roles.guard");
const org_roles_decorator_1 = require("../auth/decorators/org-roles.decorator");
const current_org_decorator_1 = require("../auth/decorators/current-org.decorator");
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getSalesSummary(organizationId, query) {
        return this.reportsService.getSalesSummary(organizationId, query);
    }
    async getSalesByCategory(organizationId, query) {
        return this.reportsService.getSalesByCategory(organizationId, query);
    }
    async getTopProducts(organizationId, query, limit) {
        return this.reportsService.getTopProducts(organizationId, query, limit ? parseInt(limit.toString(), 10) : 10);
    }
    async getInventorySummary(organizationId) {
        return this.reportsService.getInventorySummary(organizationId);
    }
    async getInventoryByCategory(organizationId) {
        return this.reportsService.getInventoryByCategory(organizationId);
    }
    async getStockMovementSummary(organizationId, query) {
        return this.reportsService.getStockMovementSummary(organizationId, query);
    }
    async getPurchaseSummary(organizationId, query) {
        return this.reportsService.getPurchaseSummary(organizationId, query);
    }
    async getPurchasesBySupplier(organizationId, query) {
        return this.reportsService.getPurchasesBySupplier(organizationId, query);
    }
    async getCashRegisterSummary(organizationId, query) {
        return this.reportsService.getCashRegisterSummary(organizationId, query);
    }
    async getDashboardMetrics(organizationId) {
        return this.reportsService.getDashboardMetrics(organizationId);
    }
    async getExpiringBatches(organizationId, daysThreshold) {
        return this.reportsService.getExpiringBatches(organizationId, daysThreshold ? parseInt(daysThreshold.toString(), 10) : 30);
    }
    async getLowStockProducts(organizationId, threshold) {
        return this.reportsService.getLowStockProducts(organizationId, threshold ? parseInt(threshold.toString(), 10) : 10);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('sales/summary'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN'),
    __param(0, (0, current_org_decorator_1.CurrentOrg)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getSalesSummary", null);
__decorate([
    (0, common_1.Get)('sales/by-category'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN'),
    __param(0, (0, current_org_decorator_1.CurrentOrg)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getSalesByCategory", null);
__decorate([
    (0, common_1.Get)('sales/top-products'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN'),
    __param(0, (0, current_org_decorator_1.CurrentOrg)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Number]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getTopProducts", null);
__decorate([
    (0, common_1.Get)('inventory/summary'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO'),
    __param(0, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getInventorySummary", null);
__decorate([
    (0, common_1.Get)('inventory/by-category'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO'),
    __param(0, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getInventoryByCategory", null);
__decorate([
    (0, common_1.Get)('stock-movements/summary'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO'),
    __param(0, (0, current_org_decorator_1.CurrentOrg)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getStockMovementSummary", null);
__decorate([
    (0, common_1.Get)('purchases/summary'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO'),
    __param(0, (0, current_org_decorator_1.CurrentOrg)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getPurchaseSummary", null);
__decorate([
    (0, common_1.Get)('purchases/by-supplier'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO'),
    __param(0, (0, current_org_decorator_1.CurrentOrg)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getPurchasesBySupplier", null);
__decorate([
    (0, common_1.Get)('cash-register/summary'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN'),
    __param(0, (0, current_org_decorator_1.CurrentOrg)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getCashRegisterSummary", null);
__decorate([
    (0, common_1.Get)('dashboard/metrics'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'VENDEDOR'),
    __param(0, (0, current_org_decorator_1.CurrentOrg)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getDashboardMetrics", null);
__decorate([
    (0, common_1.Get)('inventory/expiring-batches'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO'),
    __param(0, (0, current_org_decorator_1.CurrentOrg)()),
    __param(1, (0, common_1.Query)('daysThreshold')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getExpiringBatches", null);
__decorate([
    (0, common_1.Get)('inventory/low-stock'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO'),
    __param(0, (0, current_org_decorator_1.CurrentOrg)()),
    __param(1, (0, common_1.Query)('threshold')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getLowStockProducts", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, org_roles_guard_1.OrgRolesGuard),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map