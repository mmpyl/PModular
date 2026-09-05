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
exports.BusinessTypesController = void 0;
const common_1 = require("@nestjs/common");
const business_types_service_1 = require("./business-types.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let BusinessTypesController = class BusinessTypesController {
    constructor(businessTypesService) {
        this.businessTypesService = businessTypesService;
    }
    async seed() {
        return this.businessTypesService.seed();
    }
    findAll() {
        return this.businessTypesService.findAll();
    }
    findOne(code) {
        return this.businessTypesService.findOne(code);
    }
};
exports.BusinessTypesController = BusinessTypesController;
__decorate([
    (0, common_1.Post)('seed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BusinessTypesController.prototype, "seed", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BusinessTypesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BusinessTypesController.prototype, "findOne", null);
exports.BusinessTypesController = BusinessTypesController = __decorate([
    (0, common_1.Controller)('business-types'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [business_types_service_1.BusinessTypesService])
], BusinessTypesController);
//# sourceMappingURL=business-types.controller.js.map