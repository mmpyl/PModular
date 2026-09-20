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
exports.CashRegistersController = void 0;
const common_1 = require("@nestjs/common");
const cash_registers_service_1 = require("./cash-registers.service");
const create_cash_register_dto_1 = require("./dto/create-cash-register.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../auth/guards/tenant.guard");
const org_roles_guard_1 = require("../auth/guards/org-roles.guard");
const org_roles_decorator_1 = require("../auth/decorators/org-roles.decorator");
let CashRegistersController = class CashRegistersController {
    constructor(cashRegistersService) {
        this.cashRegistersService = cashRegistersService;
    }
    create(createCashRegisterDto, req) {
        const organizationId = req.user.organizationId;
        if (!organizationId) {
            throw new common_1.BadRequestException('Organization ID is required');
        }
        return this.cashRegistersService.create(createCashRegisterDto, organizationId);
    }
    findAll(req) {
        const organizationId = req.user.organizationId;
        if (!organizationId) {
            throw new common_1.BadRequestException('Organization ID is required');
        }
        return this.cashRegistersService.findAll(organizationId);
    }
    findOne(id, req) {
        const organizationId = req.user.organizationId;
        if (!organizationId) {
            throw new common_1.BadRequestException('Organization ID is required');
        }
        return this.cashRegistersService.findOne(id, organizationId);
    }
    getMovements(id, req) {
        const organizationId = req.user.organizationId;
        if (!organizationId) {
            throw new common_1.BadRequestException('Organization ID is required');
        }
        return this.cashRegistersService.getMovements(id, organizationId);
    }
    update(id, updateCashRegisterDto, req) {
        const organizationId = req.user.organizationId;
        if (!organizationId) {
            throw new common_1.BadRequestException('Organization ID is required');
        }
        return this.cashRegistersService.update(id, updateCashRegisterDto, organizationId);
    }
    open(id, openCashRegisterDto, req) {
        const userId = req.user.sub;
        const organizationId = req.user.organizationId;
        if (!organizationId) {
            throw new common_1.BadRequestException('Organization ID is required');
        }
        return this.cashRegistersService.open(id, openCashRegisterDto, userId, organizationId);
    }
    close(id, closeCashRegisterDto, req) {
        const userId = req.user.sub;
        const organizationId = req.user.organizationId;
        if (!organizationId) {
            throw new common_1.BadRequestException('Organization ID is required');
        }
        return this.cashRegistersService.close(id, closeCashRegisterDto, userId, organizationId);
    }
    addMovement(id, createMovementDto, req) {
        const userId = req.user.sub;
        const organizationId = req.user.organizationId;
        if (!organizationId) {
            throw new common_1.BadRequestException('Organization ID is required');
        }
        return this.cashRegistersService.addMovement(id, createMovementDto, userId, organizationId);
    }
    remove(id, req) {
        const organizationId = req.user.organizationId;
        if (!organizationId) {
            throw new common_1.BadRequestException('Organization ID is required');
        }
        return this.cashRegistersService.remove(id, organizationId);
    }
};
exports.CashRegistersController = CashRegistersController;
__decorate([
    (0, common_1.Post)(),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_cash_register_dto_1.CreateCashRegisterDto, Object]),
    __metadata("design:returntype", void 0)
], CashRegistersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'VENDEDOR', 'CAJA'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CashRegistersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'VENDEDOR', 'CAJA'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CashRegistersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/movements'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'VENDEDOR', 'CAJA'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CashRegistersController.prototype, "getMovements", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_cash_register_dto_1.UpdateCashRegisterDto, Object]),
    __metadata("design:returntype", void 0)
], CashRegistersController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/open'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'CAJA'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_cash_register_dto_1.OpenCashRegisterDto, Object]),
    __metadata("design:returntype", void 0)
], CashRegistersController.prototype, "open", null);
__decorate([
    (0, common_1.Post)(':id/close'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'CAJA'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_cash_register_dto_1.CloseCashRegisterDto, Object]),
    __metadata("design:returntype", void 0)
], CashRegistersController.prototype, "close", null);
__decorate([
    (0, common_1.Post)(':id/movements'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN', 'CAJA'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_cash_register_dto_1.CreateCashRegisterMovementDto, Object]),
    __metadata("design:returntype", void 0)
], CashRegistersController.prototype, "addMovement", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, org_roles_decorator_1.OrgRoles)('OWNER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CashRegistersController.prototype, "remove", null);
exports.CashRegistersController = CashRegistersController = __decorate([
    (0, common_1.Controller)('cash-registers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard, org_roles_guard_1.OrgRolesGuard),
    __metadata("design:paramtypes", [cash_registers_service_1.CashRegistersService])
], CashRegistersController);
//# sourceMappingURL=cash-registers.controller.js.map