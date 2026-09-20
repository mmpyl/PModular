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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCashRegisterMovementDto = exports.CloseCashRegisterDto = exports.OpenCashRegisterDto = exports.UpdateCashRegisterDto = exports.CreateCashRegisterDto = exports.PaymentMethodDto = exports.CashRegisterMovementTypeDto = exports.CashRegisterStatusDto = void 0;
const class_validator_1 = require("class-validator");
var CashRegisterStatusDto;
(function (CashRegisterStatusDto) {
    CashRegisterStatusDto["ABIERTA"] = "ABIERTA";
    CashRegisterStatusDto["CERRADA"] = "CERRADA";
    CashRegisterStatusDto["EN_PAUSA"] = "EN_PAUSA";
})(CashRegisterStatusDto || (exports.CashRegisterStatusDto = CashRegisterStatusDto = {}));
var CashRegisterMovementTypeDto;
(function (CashRegisterMovementTypeDto) {
    CashRegisterMovementTypeDto["APERTURA"] = "APERTURA";
    CashRegisterMovementTypeDto["INGRESO_VENTA"] = "INGRESO_VENTA";
    CashRegisterMovementTypeDto["INGRESO_OTRO"] = "INGRESO_OTRO";
    CashRegisterMovementTypeDto["SALIDA_GASTO"] = "SALIDA_GASTO";
    CashRegisterMovementTypeDto["SALIDA_RETIRO"] = "SALIDA_RETIRO";
    CashRegisterMovementTypeDto["CIERRE"] = "CIERRE";
    CashRegisterMovementTypeDto["AJUSTE"] = "AJUSTE";
})(CashRegisterMovementTypeDto || (exports.CashRegisterMovementTypeDto = CashRegisterMovementTypeDto = {}));
var PaymentMethodDto;
(function (PaymentMethodDto) {
    PaymentMethodDto["EFECTIVO"] = "EFECTIVO";
    PaymentMethodDto["TARJETA_CREDITO"] = "TARJETA_CREDITO";
    PaymentMethodDto["TARJETA_DEBITO"] = "TARJETA_DEBITO";
    PaymentMethodDto["TRANSFERENCIA"] = "TRANSFERENCIA";
    PaymentMethodDto["YAPE_PLIN"] = "YAPE_PLIN";
    PaymentMethodDto["CHEQUE"] = "CHEQUE";
    PaymentMethodDto["CREDITO_TIENDA"] = "CREDITO_TIENDA";
})(PaymentMethodDto || (exports.PaymentMethodDto = PaymentMethodDto = {}));
class CreateCashRegisterDto {
    constructor() {
        this.openingBalance = 0;
    }
}
exports.CreateCashRegisterDto = CreateCashRegisterDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCashRegisterDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCashRegisterDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateCashRegisterDto.prototype, "openingBalance", void 0);
class UpdateCashRegisterDto {
}
exports.UpdateCashRegisterDto = UpdateCashRegisterDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCashRegisterDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCashRegisterDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(CashRegisterStatusDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateCashRegisterDto.prototype, "status", void 0);
class OpenCashRegisterDto {
    constructor() {
        this.openingBalance = 0;
    }
}
exports.OpenCashRegisterDto = OpenCashRegisterDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], OpenCashRegisterDto.prototype, "openingBalance", void 0);
class CloseCashRegisterDto {
}
exports.CloseCashRegisterDto = CloseCashRegisterDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CloseCashRegisterDto.prototype, "actualClosingBalance", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CloseCashRegisterDto.prototype, "closingNotes", void 0);
class CreateCashRegisterMovementDto {
}
exports.CreateCashRegisterMovementDto = CreateCashRegisterMovementDto;
__decorate([
    (0, class_validator_1.IsEnum)(CashRegisterMovementTypeDto),
    __metadata("design:type", String)
], CreateCashRegisterMovementDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCashRegisterMovementDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCashRegisterMovementDto.prototype, "isPositive", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(PaymentMethodDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCashRegisterMovementDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCashRegisterMovementDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCashRegisterMovementDto.prototype, "saleId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCashRegisterMovementDto.prototype, "notes", void 0);
//# sourceMappingURL=create-cash-register.dto.js.map