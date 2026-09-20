"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessEntitiesModule = void 0;
const common_1 = require("@nestjs/common");
const business_entities_service_1 = require("./business-entities.service");
const business_entities_controller_1 = require("./business-entities.controller");
const prisma_module_1 = require("../prisma.module");
let BusinessEntitiesModule = class BusinessEntitiesModule {
};
exports.BusinessEntitiesModule = BusinessEntitiesModule;
exports.BusinessEntitiesModule = BusinessEntitiesModule = __decorate([
    (0, common_1.Module)({
        controllers: [business_entities_controller_1.BusinessEntitiesController],
        providers: [business_entities_service_1.BusinessEntitiesService],
        imports: [prisma_module_1.PrismaModule],
        exports: [business_entities_service_1.BusinessEntitiesService],
    })
], BusinessEntitiesModule);
//# sourceMappingURL=business-entities.module.js.map