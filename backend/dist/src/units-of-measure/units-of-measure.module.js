"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitsOfMeasureModule = void 0;
const common_1 = require("@nestjs/common");
const units_of_measure_controller_1 = require("./units-of-measure.controller");
const units_of_measure_service_1 = require("./units-of-measure.service");
const prisma_module_1 = require("../prisma.module");
let UnitsOfMeasureModule = class UnitsOfMeasureModule {
};
exports.UnitsOfMeasureModule = UnitsOfMeasureModule;
exports.UnitsOfMeasureModule = UnitsOfMeasureModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [units_of_measure_controller_1.UnitsOfMeasureController],
        providers: [units_of_measure_service_1.UnitsOfMeasureService],
        exports: [units_of_measure_service_1.UnitsOfMeasureService],
    })
], UnitsOfMeasureModule);
//# sourceMappingURL=units-of-measure.module.js.map