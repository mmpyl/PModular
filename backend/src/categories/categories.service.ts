import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface CreateCategoryDto {
  name: string;
  parentId?: string;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, data: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        organizationId,
        name: data.name,
        parentId: data.parentId,
      },
      include: {
        parent: true,
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.category.findMany({
      where: { organizationId },
      include: {
        parent: true,
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  findOne(organizationId: string, id: string) {
    return this.prisma.category.findUnique({
      where: { id, organizationId },
      include: {
        parent: true,
        children: true,
        products: { take: 10, select: { id: true, name: true, sku: true } },
      },
    });
  }

  async update(organizationId: string, id: string, data: Partial<CreateCategoryDto>) {
    const existing = await this.prisma.category.findUnique({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada en esta organización`);
    }

    return this.prisma.category.update({
      where: { id, organizationId },
      data,
    });
  }

  async remove(organizationId: string, id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada en esta organización`);
    }

    return this.prisma.category.delete({
      where: { id, organizationId },
    });
  }
}
