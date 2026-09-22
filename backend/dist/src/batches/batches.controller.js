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
exports.BatchesController = void 0;
const common_1 = require("@nestjs/common");
const batches_service_1 = require("./batches.service");
const org_roles_decorator_1 = require("../auth/decorators/org-roles.decorator");
const org_roles_guard_1 = require("../auth/guards/org-roles.guard");
const tenant_guard_1 = require("../auth/guards/tenant.guard");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const client_1 = require("@prisma/client");
let BatchesController = class BatchesController {
    constructor(batchesService) {
        this.batchesService = batchesService;
    }
    async createBatch(req, dto) {
        const organizationId = req.organizationId;
        return this.batchesService.createBatch({
            ...dto,
            organizationId,
        });
    }
    async getBatches(req, productId, status, expiringSoon, days) {
        const organizationId = req.organizationId;
        return this.batchesService.getBatches(organizationId, {
            productId,
            status,
            expiringSoon: expiringSoon === 'true',
            daysThreshold: days ? parseInt(days, 10) : 30,
        });
    }
    async getBatchById(req, id) {
        const organizationId = req.organizationId;
        return this.batchesService.getBatchById(organizationId, id);
    }
    async updateBatch(req, id, dto) {
        const organizationId = req.organizationId;
        return this.batchesService.updateBatch(organizationId, id, dto);
    }
    async retainBatch(req, id, body) {
        const organizationId = req.organizationId;
        return this.batchesService.retainBatch(organizationId, id, body.reason);
    }
    async releaseBatch(req, id) {
        const organizationId = req.organizationId;
        return this.batchesService.releaseBatch(organizationId, id);
    }
    async markAsExpired(req, id) {
        const organizationId = req.organizationId;
        return this.batchesService.markAsExpired(organizationId, id);
    }
    async getBatchStats(req) {
        const organizationId = req.organizationId;
        return this.batchesService.getBatchStats(organizationId);
    }
};
exports.BatchesController = BatchesController;
__decorate([
    (0, common_1.Post)(),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BatchesController.prototype, "createBatch", null);
__decorate([
    (0, common_1.Get)(),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('productId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('expiringSoon')),
    __param(4, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], BatchesController.prototype, "getBatches", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BatchesController.prototype, "getBatchById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], BatchesController.prototype, "updateBatch", null);
__decorate([
    (0, common_1.Post)(':id/retain'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], BatchesController.prototype, "retainBatch", null);
__decorate([
    (0, common_1.Post)(':id/release'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BatchesController.prototype, "releaseBatch", null);
__decorate([
    (0, common_1.Post)(':id/expire'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BatchesController.prototype, "markAsExpired", null);
__decorate([
    (0, common_1.Get)('stats/summary'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BatchesController.prototype, "getBatchStats", null);
exports.BatchesController = BatchesController = __decorate([
    (0, common_1.Controller)('batches'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, org_roles_guard_1.OrgRolesGuard),
    __metadata("design:paramtypes", [batches_service_1.BatchesService])
], BatchesController);
//# sourceMappingURL=batches.controller.js.map