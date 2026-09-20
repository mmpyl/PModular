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
exports.ProcessPaymentDto = exports.UpdateSaleDto = exports.CreateSaleDto = exports.SaleItemDto = exports.PaymentTerm = exports.SaleType = exports.SaleStatus = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var SaleStatus;
(function (SaleStatus) {
    SaleStatus["BORRADOR"] = "BORRADOR";
    SaleStatus["CONFIRMADA"] = "CONFIRMADA";
    SaleStatus["EN_PROCESO"] = "EN_PROCESO";
    SaleStatus["COMPLETADA"] = "COMPLETADA";
    SaleStatus["CANCELADA"] = "CANCELADA";
    SaleStatus["DEVUELTA_PARCIAL"] = "DEVUELTA_PARCIAL";
    SaleStatus["DEVUELTA_TOTAL"] = "DEVUELTA_TOTAL";
})(SaleStatus || (exports.SaleStatus = SaleStatus = {}));
var SaleType;
(function (SaleType) {
    SaleType["VENTA_MOSTRADOR"] = "VENTA_MOSTRADOR";
    SaleType["PEDIDO"] = "PEDIDO";
    SaleType["RESERVA"] = "RESERVA";
    SaleType["ENTREGA_DOMICILIO"] = "ENTREGA_DOMICILIO";
})(SaleType || (exports.SaleType = SaleType = {}));
var PaymentTerm;
(function (PaymentTerm) {
    PaymentTerm["CONTADO"] = "CONTADO";
    PaymentTerm["CREDITO_7_DIAS"] = "CREDITO_7_DIAS";
    PaymentTerm["CREDITO_15_DIAS"] = "CREDITO_15_DIAS";
    PaymentTerm["CREDITO_30_DIAS"] = "CREDITO_30_DIAS";
    PaymentTerm["CREDITO_60_DIAS"] = "CREDITO_60_DIAS";
    PaymentTerm["CREDITO_90_DIAS"] = "CREDITO_90_DIAS";
    PaymentTerm["PERSONALIZADO"] = "PERSONALIZADO";
})(PaymentTerm || (exports.PaymentTerm = PaymentTerm = {}));
class SaleItemDto {
}
exports.SaleItemDto = SaleItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaleItemDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SaleItemDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SaleItemDto.prototype, "unitPrice", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SaleItemDto.prototype, "discount", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SaleItemDto.prototype, "taxRate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SaleItemDto.prototype, "batchId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SaleItemDto.prototype, "notes", void 0);
class CreateSaleDto {
}
exports.CreateSaleDto = CreateSaleDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "customerId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(SaleType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(SaleStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "deliveryDate", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(PaymentTerm),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "paymentTerm", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "paymentDueDate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateSaleDto.prototype, "discount", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateSaleDto.prototype, "taxRate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSaleDto.prototype, "internalNotes", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SaleItemDto),
    __metadata("design:type", Array)
], CreateSaleDto.prototype, "items", void 0);
class UpdateSaleDto {
}
exports.UpdateSaleDto = UpdateSaleDto;
__decorate([
    (0, class_validator_1.IsEnum)(SaleStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSaleDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSaleDto.prototype, "customerId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(SaleType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSaleDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSaleDto.prototype, "deliveryDate", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(PaymentTerm),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSaleDto.prototype, "paymentTerm", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSaleDto.prototype, "paymentDueDate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateSaleDto.prototype, "discount", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateSaleDto.prototype, "taxRate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSaleDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSaleDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSaleDto.prototype, "internalNotes", void 0);
class ProcessPaymentDto {
}
exports.ProcessPaymentDto = ProcessPaymentDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ProcessPaymentDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcessPaymentDto.prototype, "method", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProcessPaymentDto.prototype, "transactionId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProcessPaymentDto.prototype, "bankName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProcessPaymentDto.prototype, "cardLastFour", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ProcessPaymentDto.prototype, "notes", void 0);
//# sourceMappingURL=create-sale.dto.js.map