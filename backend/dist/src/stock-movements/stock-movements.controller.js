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
exports.StockMovementsController = void 0;
const common_1 = require("@nestjs/common");
const stock_movements_service_1 = require("./stock-movements.service");
const org_roles_decorator_1 = require("../auth/decorators/org-roles.decorator");
const org_roles_guard_1 = require("../auth/guards/org-roles.guard");
const tenant_guard_1 = require("../auth/guards/tenant.guard");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let StockMovementsController = class StockMovementsController {
    constructor(stockMovementService) {
        this.stockMovementService = stockMovementService;
    }
    async createMovement(req, dto) {
        const organizationId = req.organizationId;
        const performedBy = req.user?.sub || 'system';
        const validReasons = [
            'COMPRA',
            'PRODUCCION',
            'DEVOLUCION_CLIENTE',
            'ENTRADA_INICIAL',
            'VENTA',
            'MERMA',
            'ROBO',
            'OBSOLETO',
            'CONSUMO_INTERNO',
            'CONTEO_FISICO',
            'ERROR_SISTEMA',
            'TRANSFERENCIA_ENTRADA',
            'TRANSFERENCIA_SALIDA',
        ];
        if (!validReasons.includes(dto.reason)) {
            throw new common_1.BadRequestException(`Invalid reason: ${dto.reason}`);
        }
        return this.stockMovementService.createStockMovement({
            ...dto,
            reason: dto.reason,
            organizationId,
            performedBy,
        });
    }
    async getMovements(req, productId, type, reason, referenceType, referenceId) {
        const organizationId = req.organizationId;
        return this.stockMovementService.getMovements(organizationId, {
            productId,
            type,
            reason,
            referenceType,
            referenceId,
        });
    }
    async getMovementById(req, id) {
        const organizationId = req.organizationId;
        return this.stockMovementService.getMovementById(organizationId, id);
    }
    async registerInitialStock(req, dto) {
        const organizationId = req.organizationId;
        const performedBy = req.user?.sub || 'system';
        return this.stockMovementService.registerInitialStock(dto.productId, organizationId, dto.quantity, dto.unitCost, dto.batchNumber, dto.expirationDate ? new Date(dto.expirationDate) : undefined, performedBy);
    }
};
exports.StockMovementsController = StockMovementsController;
__decorate([
    (0, common_1.Post)(),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StockMovementsController.prototype, "createMovement", null);
__decorate([
    (0, common_1.Get)(),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('productId')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('reason')),
    __param(4, (0, common_1.Query)('referenceType')),
    __param(5, (0, common_1.Query)('referenceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], StockMovementsController.prototype, "getMovements", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StockMovementsController.prototype, "getMovementById", null);
__decorate([
    (0, common_1.Post)('initial-stock'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'INVENTARIO'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StockMovementsController.prototype, "registerInitialStock", null);
exports.StockMovementsController = StockMovementsController = __decorate([
    (0, common_1.Controller)('stock-movements'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, org_roles_guard_1.OrgRolesGuard),
    __metadata("design:paramtypes", [stock_movements_service_1.StockMovementService])
], StockMovementsController);
//# sourceMappingURL=stock-movements.controller.js.map