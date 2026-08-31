import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface CreateUnitOfMeasureDto {
  name: string;
  symbol?: string;
  isFractionable?: boolean;
}

@Injectable()
export class UnitsOfMeasureService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, data: CreateUnitOfMeasureDto) {
    return this.prisma.unitOfMeasure.create({
      data: {
        organizationId,
        name: data.name,
        symbol: data.symbol,
        isFractionable: data.isFractionable ?? false,
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.unitOfMeasure.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  findOne(organizationId: string, id: string) {
    return this.prisma.unitOfMeasure.findUnique({
      where: { id, organizationId },
    });
  }

  async update(organizationId: string, id: string, data: Partial<CreateUnitOfMeasureDto>) {
    const existing = await this.prisma.unitOfMeasure.findUnique({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Unidad de medida con ID ${id} no encontrada en esta organización`);
    }

    return this.prisma.unitOfMeasure.update({
      where: { id, organizationId },
      data,
    });
  }

  async remove(organizationId: string, id: string) {
    const existing = await this.prisma.unitOfMeasure.findUnique({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Unidad de medida con ID ${id} no encontrada en esta organización`);
    }

    return this.prisma.unitOfMeasure.delete({
      where: { id, organizationId },
    });
  }
}
