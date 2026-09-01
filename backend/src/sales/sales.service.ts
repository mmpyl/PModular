import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SalesRepository } from '../repositories/sales.repository';
import { CreateSaleDto, UpdateSaleDto, CompleteSaleDto } from '../dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(private readonly salesRepository: SalesRepository) {}

  async findAll(organizationId: string) {
    return this.salesRepository.findAll(organizationId);
  }

  async findOne(id: string, organizationId: string) {
    const sale = await this.salesRepository.findOne(id, organizationId);
    if (!sale) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }
    return sale;
  }

  async create(data: CreateSaleDto, userId: string, organizationId: string) {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('La venta debe tener al menos un item');
    }
    return this.salesRepository.create(data, userId, organizationId);
  }

  async update(id: string, data: UpdateSaleDto, organizationId: string) {
    const sale = await this.salesRepository.findOne(id, organizationId);
    if (!sale) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }
    if (sale.status !== 'PENDIENTE') {
      throw new BadRequestException('Solo se pueden modificar ventas pendientes');
    }
    return this.salesRepository.update(id, data, organizationId);
  }

  async complete(id: string, data: CompleteSaleDto, userId: string, organizationId: string) {
    const sale = await this.salesRepository.findOne(id, organizationId);
    if (!sale) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }
    if (sale.status !== 'PENDIENTE') {
      throw new BadRequestException('Solo se pueden completar ventas pendientes');
    }
    if (!data.payments || data.payments.length === 0) {
      throw new BadRequestException('Debe especificar al menos un pago');
    }
    return this.salesRepository.complete(id, data.payments, userId, organizationId);
  }

  async cancel(id: string, organizationId: string) {
    const sale = await this.salesRepository.findOne(id, organizationId);
    if (!sale) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }
    if (sale.status !== 'PENDIENTE') {
      throw new BadRequestException('Solo se pueden cancelar ventas pendientes');
    }
    return this.salesRepository.cancel(id, organizationId);
  }

  async remove(id: string, organizationId: string) {
    return this.salesRepository.delete(id, organizationId);
  }
}
