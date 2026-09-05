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
exports.UnitsOfMeasureController = void 0;
const common_1 = require("@nestjs/common");
const units_of_measure_service_1 = require("./units-of-measure.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const tenant_guard_1 = require("../auth/guards/tenant.guard");
let UnitsOfMeasureController = class UnitsOfMeasureController {
    constructor(unitsOfMeasureService) {
        this.unitsOfMeasureService = unitsOfMeasureService;
    }
    create(createUnitDto, organizationId) {
        return this.unitsOfMeasureService.create(organizationId, createUnitDto);
    }
    findAll(organizationId) {
        return this.unitsOfMeasureService.findAll(organizationId);
    }
    findOne(id, organizationId) {
        return this.unitsOfMeasureService.findOne(organizationId, id);
    }
    remove(id, organizationId) {
        return this.unitsOfMeasureService.remove(organizationId, id);
    }
};
exports.UnitsOfMeasureController = UnitsOfMeasureController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UnitsOfMeasureController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UnitsOfMeasureController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UnitsOfMeasureController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('organizationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UnitsOfMeasureController.prototype, "remove", null);
exports.UnitsOfMeasureController = UnitsOfMeasureController = __decorate([
    (0, common_1.Controller)('units-of-measure'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, tenant_guard_1.TenantGuard),
    __metadata("design:paramtypes", [units_of_measure_service_1.UnitsOfMeasureService])
], UnitsOfMeasureController);
//# sourceMappingURL=units-of-measure.controller.js.map