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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const inventory_service_1 = require("./inventory.service");
const stock_movements_service_1 = require("../stock-movements/stock-movements.service");
const org_roles_decorator_1 = require("../auth/decorators/org-roles.decorator");
const org_roles_guard_1 = require("../auth/guards/org-roles.guard");
const tenant_guard_1 = require("../auth/guards/tenant.guard");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let InventoryController = class InventoryController {
    constructor(inventoryService, stockMovementService) {
        this.inventoryService = inventoryService;
        this.stockMovementService = stockMovementService;
    }
    async getInventory(req, productId) {
        const organizationId = req.organizationId;
        return this.inventoryService.getInventory(organizationId, productId);
    }
    async getInventoryById(req, id) {
        const organizationId = req.organizationId;
        return this.inventoryService.getInventoryById(organizationId, id);
    }
    async updateInventory(req, id, dto) {
        const organizationId = req.organizationId;
        const updateData = {};
        if (dto.quantity !== undefined) {
            updateData.quantity = parseFloat(dto.quantity);
        }
        if (dto.reserved !== undefined) {
            updateData.reserved = parseFloat(dto.reserved);
        }
        if (dto.averageCost !== undefined) {
            updateData.averageCost = parseFloat(dto.averageCost);
        }
        return this.inventoryService.updateInventory(organizationId, id, updateData);
    }
    async recalculateInventory(req, productId) {
        const organizationId = req.organizationId;
        console.warn(`Manual inventory recalculation triggered for product ${productId}. ` +
            'This should not be needed if all stock operations use StockMovementService.adjustStock().');
        return this.stockMovementService.recalculateInventory(productId, organizationId);
    }
    async getLowStock(req, threshold) {
        const organizationId = req.organizationId;
        const thresholdNum = threshold ? parseInt(threshold, 10) : 10;
        return this.inventoryService.getLowStockItems(organizationId, thresholdNum);
    }
    async getExpiringBatches(req, days) {
        const organizationId = req.organizationId;
        const daysNum = days ? parseInt(days, 10) : 30;
        return this.inventoryService.getExpiringBatches(organizationId, daysNum);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)(),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getInventory", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getInventoryById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "updateInventory", null);
__decorate([
    (0, common_1.Post)('recalculate/:productId'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "recalculateInventory", null);
__decorate([
    (0, common_1.Get)('alerts/low-stock'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('threshold')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getLowStock", null);
__decorate([
    (0, common_1.Get)('alerts/expiring'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getExpiringBatches", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)('inventory'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, org_roles_guard_1.OrgRolesGuard),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService,
        stock_movements_service_1.StockMovementService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map