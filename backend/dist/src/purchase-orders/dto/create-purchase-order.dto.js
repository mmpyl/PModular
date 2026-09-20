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
exports.ReceiveOrderItemDto = exports.ReceivePurchaseOrderDto = exports.UpdatePurchaseOrderDto = exports.CreatePurchaseOrderDto = exports.PurchaseOrderItemDto = exports.PaymentTerm = exports.PurchaseOrderStatus = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var PurchaseOrderStatus;
(function (PurchaseOrderStatus) {
    PurchaseOrderStatus["BORRADOR"] = "BORRADOR";
    PurchaseOrderStatus["ENVIADA"] = "ENVIADA";
    PurchaseOrderStatus["CONFIRMADA"] = "CONFIRMADA";
    PurchaseOrderStatus["PARCIALMENTE_RECIBIDA"] = "PARCIALMENTE_RECIBIDA";
    PurchaseOrderStatus["COMPLETADA"] = "COMPLETADA";
    PurchaseOrderStatus["CANCELADA"] = "CANCELADA";
})(PurchaseOrderStatus || (exports.PurchaseOrderStatus = PurchaseOrderStatus = {}));
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
class PurchaseOrderItemDto {
}
exports.PurchaseOrderItemDto = PurchaseOrderItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PurchaseOrderItemDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PurchaseOrderItemDto.prototype, "quantityOrdered", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PurchaseOrderItemDto.prototype, "unitCost", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], PurchaseOrderItemDto.prototype, "discount", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], PurchaseOrderItemDto.prototype, "taxRate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PurchaseOrderItemDto.prototype, "batchNumber", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PurchaseOrderItemDto.prototype, "expirationDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PurchaseOrderItemDto.prototype, "notes", void 0);
class CreatePurchaseOrderDto {
}
exports.CreatePurchaseOrderDto = CreatePurchaseOrderDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "supplierId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(PurchaseOrderStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "expectedDeliveryDate", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(PaymentTerm),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "paymentTerm", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "paymentDueDate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreatePurchaseOrderDto.prototype, "discount", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreatePurchaseOrderDto.prototype, "taxRate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "internalNotes", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "externalReference", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PurchaseOrderItemDto),
    __metadata("design:type", Array)
], CreatePurchaseOrderDto.prototype, "items", void 0);
class UpdatePurchaseOrderDto {
}
exports.UpdatePurchaseOrderDto = UpdatePurchaseOrderDto;
__decorate([
    (0, class_validator_1.IsEnum)(PurchaseOrderStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePurchaseOrderDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePurchaseOrderDto.prototype, "supplierId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePurchaseOrderDto.prototype, "expectedDeliveryDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePurchaseOrderDto.prototype, "receivedDate", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(PaymentTerm),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePurchaseOrderDto.prototype, "paymentTerm", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePurchaseOrderDto.prototype, "paymentDueDate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdatePurchaseOrderDto.prototype, "discount", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdatePurchaseOrderDto.prototype, "taxRate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePurchaseOrderDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePurchaseOrderDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePurchaseOrderDto.prototype, "internalNotes", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePurchaseOrderDto.prototype, "externalReference", void 0);
class ReceivePurchaseOrderDto {
}
exports.ReceivePurchaseOrderDto = ReceivePurchaseOrderDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ReceiveOrderItemDto),
    __metadata("design:type", Array)
], ReceivePurchaseOrderDto.prototype, "items", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReceivePurchaseOrderDto.prototype, "notes", void 0);
class ReceiveOrderItemDto {
}
exports.ReceiveOrderItemDto = ReceiveOrderItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReceiveOrderItemDto.prototype, "itemId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ReceiveOrderItemDto.prototype, "quantityReceived", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReceiveOrderItemDto.prototype, "batchNumber", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReceiveOrderItemDto.prototype, "expirationDate", void 0);
//# sourceMappingURL=create-purchase-order.dto.js.map