"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashRegistersModule = void 0;
const common_1 = require("@nestjs/common");
const cash_registers_controller_1 = require("./cash-registers.controller");
const cash_registers_service_1 = require("./cash-registers.service");
const cash_registers_repository_1 = require("./repositories/cash-registers.repository");
const prisma_module_1 = require("../prisma.module");
let CashRegistersModule = class CashRegistersModule {
};
exports.CashRegistersModule = CashRegistersModule;
exports.CashRegistersModule = CashRegistersModule = __decorate([
    (0, common_1.Module)({
        controllers: [cash_registers_controller_1.CashRegistersController],
        providers: [cash_registers_service_1.CashRegistersService, cash_registers_repository_1.CashRegistersRepository],
        imports: [prisma_module_1.PrismaModule],
        exports: [cash_registers_service_1.CashRegistersService],
    })
], CashRegistersModule);
//# sourceMappingURL=cash-registers.module.js.map