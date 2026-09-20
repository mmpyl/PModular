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
exports.CashRegistersService = void 0;
const common_1 = require("@nestjs/common");
const cash_registers_repository_1 = require("./repositories/cash-registers.repository");
let CashRegistersService = class CashRegistersService {
    constructor(cashRegistersRepository) {
        this.cashRegistersRepository = cashRegistersRepository;
    }
    async findAll(organizationId) {
        return this.cashRegistersRepository.findAll(organizationId);
    }
    async findOne(id, organizationId) {
        const cashRegister = await this.cashRegistersRepository.findOne(id, organizationId);
        if (!cashRegister) {
            throw new common_1.NotFoundException(`Caja con ID ${id} no encontrada`);
        }
        return cashRegister;
    }
    async create(data, organizationId) {
        return this.cashRegistersRepository.create(data, organizationId);
    }
    async update(id, data, organizationId) {
        const cashRegister = await this.cashRegistersRepository.findOne(id, organizationId);
        if (!cashRegister) {
            throw new common_1.NotFoundException(`Caja con ID ${id} no encontrada`);
        }
        return this.cashRegistersRepository.update(id, data, organizationId);
    }
    async open(id, data, userId, organizationId) {
        const cashRegister = await this.cashRegistersRepository.findOne(id, organizationId);
        if (!cashRegister) {
            throw new common_1.NotFoundException(`Caja con ID ${id} no encontrada`);
        }
        return this.cashRegistersRepository.open(id, data, userId, organizationId);
    }
    async close(id, data, userId, organizationId) {
        const cashRegister = await this.cashRegistersRepository.findOne(id, organizationId);
        if (!cashRegister) {
            throw new common_1.NotFoundException(`Caja con ID ${id} no encontrada`);
        }
        return this.cashRegistersRepository.close(id, data, userId, organizationId);
    }
    async addMovement(id, data, userId, organizationId) {
        const cashRegister = await this.cashRegistersRepository.findOne(id, organizationId);
        if (!cashRegister) {
            throw new common_1.NotFoundException(`Caja con ID ${id} no encontrada`);
        }
        return this.cashRegistersRepository.addMovement(id, data, userId, organizationId);
    }
    async getMovements(id, organizationId) {
        const cashRegister = await this.cashRegistersRepository.findOne(id, organizationId);
        if (!cashRegister) {
            throw new common_1.NotFoundException(`Caja con ID ${id} no encontrada`);
        }
        return this.cashRegistersRepository.getMovements(id, organizationId);
    }
    async remove(id, organizationId) {
        return this.cashRegistersRepository.delete(id, organizationId);
    }
};
exports.CashRegistersService = CashRegistersService;
exports.CashRegistersService = CashRegistersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cash_registers_repository_1.CashRegistersRepository])
], CashRegistersService);
//# sourceMappingURL=cash-registers.service.js.map