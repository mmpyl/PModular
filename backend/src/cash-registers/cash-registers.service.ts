import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CashRegistersRepository } from '../repositories/cash-registers.repository';
import { CreateCashRegisterDto, UpdateCashRegisterDto, OpenCashRegisterDto, CloseCashRegisterDto, CreateCashRegisterMovementDto } from '../dto/create-cash-register.dto';

@Injectable()
export class CashRegistersService {
  constructor(private readonly cashRegistersRepository: CashRegistersRepository) {}

  async findAll(organizationId: string) {
    return this.cashRegistersRepository.findAll(organizationId);
  }

  async findOne(id: string, organizationId: string) {
    const cashRegister = await this.cashRegistersRepository.findOne(id, organizationId);
    if (!cashRegister) {
      throw new NotFoundException(`Caja con ID ${id} no encontrada`);
    }
    return cashRegister;
  }

  async create(data: CreateCashRegisterDto, organizationId: string) {
    return this.cashRegistersRepository.create(data, organizationId);
  }

  async update(id: string, data: UpdateCashRegisterDto, organizationId: string) {
    const cashRegister = await this.cashRegistersRepository.findOne(id, organizationId);
    if (!cashRegister) {
      throw new NotFoundException(`Caja con ID ${id} no encontrada`);
    }
    return this.cashRegistersRepository.update(id, data, organizationId);
  }

  async open(id: string, data: OpenCashRegisterDto, userId: string, organizationId: string) {
    const cashRegister = await this.cashRegistersRepository.findOne(id, organizationId);
    if (!cashRegister) {
      throw new NotFoundException(`Caja con ID ${id} no encontrada`);
    }
    return this.cashRegistersRepository.open(id, data, userId, organizationId);
  }

  async close(id: string, data: CloseCashRegisterDto, userId: string, organizationId: string) {
    const cashRegister = await this.cashRegistersRepository.findOne(id, organizationId);
    if (!cashRegister) {
      throw new NotFoundException(`Caja con ID ${id} no encontrada`);
    }
    return this.cashRegistersRepository.close(id, data, userId, organizationId);
  }

  async addMovement(
    id: string,
    data: CreateCashRegisterMovementDto,
    userId: string,
    organizationId: string,
  ) {
    const cashRegister = await this.cashRegistersRepository.findOne(id, organizationId);
    if (!cashRegister) {
      throw new NotFoundException(`Caja con ID ${id} no encontrada`);
    }
    return this.cashRegistersRepository.addMovement(id, data, userId, organizationId);
  }

  async getMovements(id: string, organizationId: string) {
    const cashRegister = await this.cashRegistersRepository.findOne(id, organizationId);
    if (!cashRegister) {
      throw new NotFoundException(`Caja con ID ${id} no encontrada`);
    }
    return this.cashRegistersRepository.getMovements(id, organizationId);
  }

  async remove(id: string, organizationId: string) {
    return this.cashRegistersRepository.delete(id, organizationId);
  }
}
