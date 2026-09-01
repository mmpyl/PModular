import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBusinessEntityDto, UpdateBusinessEntityDto, EntityType } from './dto/create-business-entity.dto';

@Injectable()
export class BusinessEntitiesService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateBusinessEntityDto) {
    return this.prisma.businessEntity.create({
      data: {
        ...dto,
        organizationId,
      },
    });
  }

  async findAll(organizationId: string, entityType?: EntityType, search?: string) {
    const where: any = { organizationId };

    if (entityType) {
      where.entityType = entityType;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { taxId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.businessEntity.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const entity = await this.prisma.businessEntity.findFirst({
      where: { id, organizationId },
    });

    if (!entity) {
      throw new NotFoundException(`Business entity with ID ${id} not found`);
    }

    return entity;
  }

  async update(organizationId: string, id: string, dto: UpdateBusinessEntityDto) {
    await this.findOne(organizationId, id);

    return this.prisma.businessEntity.update({
      where: { id },
      data: dto,
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);

    return this.prisma.businessEntity.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    return this.prisma.businessEntity.delete({
      where: { id },
    });
  }
}
