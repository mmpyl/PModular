import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface CreateProductDto {
  name: string;
  sku?: string;
  description?: string;
  price: number;
  cost?: number;
  categoryId?: string;
  unitId?: string;
  attributes?: Record<string, any>;
  isActive?: boolean;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, data: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        organizationId,
        name: data.name,
        sku: data.sku,
        description: data.description,
        price: data.price,
        cost: data.cost,
        categoryId: data.categoryId,
        unitId: data.unitId,
        attributes: data.attributes || {},
        isActive: data.isActive ?? true,
      },
      include: {
        category: true,
        unit: true,
      },
    });
  }

  findAll(organizationId: string, options?: { categoryId?: string; search?: string }) {
    const where: any = { organizationId };

    if (options?.categoryId) {
      where.categoryId = options.categoryId;
    }

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { sku: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.product.findMany({
      where,
      include: {
        category: true,
        unit: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  findOne(organizationId: string, id: string) {
    return this.prisma.product.findUnique({
      where: { id, organizationId },
      include: {
        category: true,
        unit: true,
      },
    });
  }

  async update(organizationId: string, id: string, data: Partial<CreateProductDto>) {
    const existing = await this.prisma.product.findUnique({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado en esta organización`);
    }

    return this.prisma.product.update({
      where: { id, organizationId },
      data,
    });
  }

  async remove(organizationId: string, id: string) {
    const existing = await this.prisma.product.findUnique({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado en esta organización`);
    }

    return this.prisma.product.delete({
      where: { id, organizationId },
    });
  }
}
