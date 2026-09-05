"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessTypesModule = void 0;
const common_1 = require("@nestjs/common");
const business_types_controller_1 = require("./business-types.controller");
const business_types_service_1 = require("./business-types.service");
const prisma_module_1 = require("../prisma.module");
let BusinessTypesModule = class BusinessTypesModule {
};
exports.BusinessTypesModule = BusinessTypesModule;
exports.BusinessTypesModule = BusinessTypesModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [business_types_controller_1.BusinessTypesController],
        providers: [business_types_service_1.BusinessTypesService],
        exports: [business_types_service_1.BusinessTypesService],
    })
], BusinessTypesModule);
//# sourceMappingURL=business-types.module.js.map