import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Batch, BatchStatus } from '@prisma/client';

interface CreateBatchDto {
  productId: string;
  batchNumber: string;
  serialNumber?: string;
  manufacturingDate?: Date;
  expirationDate?: Date;
  initialQuantity: number;
  unitCost: number;
  location?: string;
  organizationId: string;
}

interface UpdateBatchDto {
  status?: BatchStatus;
  location?: string;
  expirationDate?: Date;
}

@Injectable()
export class BatchesService {
  constructor(private prisma: PrismaService) {}

  async createBatch(dto: CreateBatchDto): Promise<Batch> {
    const { productId, batchNumber, organizationId } = dto;

    // Verificar que el producto exista
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    // Verificar que no exista un lote con el mismo número para este producto
    const existing = await this.prisma.batch.findUnique({
      where: {
        productId_batchNumber_organizationId: {
          productId,
          batchNumber,
          organizationId,
        },
      },
    });

    if (existing) {
      throw new NotFoundException(
        `Batch with number ${batchNumber} already exists for product ${productId}`,
      );
    }

    return this.prisma.batch.create({
      data: {
        ...dto,
        currentQuantity: dto.initialQuantity,
        status: BatchStatus.ACTIVO,
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
      },
    });
  }

  async getBatches(
    organizationId: string,
    filters?: {
      productId?: string;
      status?: BatchStatus;
      expiringSoon?: boolean;
      daysThreshold?: number;
    },
  ): Promise<Batch[]> {
    const where: any = { organizationId };

    if (filters?.productId) {
      where.productId = filters.productId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.expiringSoon) {
      const futureDate = new Date();
      futureDate.setDate(
        futureDate.getDate() + (filters.daysThreshold || 30),
      );
      where.expirationDate = {
        lte: futureDate,
        not: null,
      };
      where.status = 'ACTIVO';
    }

    return this.prisma.batch.findMany({
      where,
      include: {
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
      },
      orderBy: {
        expirationDate: 'asc',
      },
    });
  }

  async getBatchById(organizationId: string, id: string): Promise<Batch> {
    const batch = await this.prisma.batch.findUnique({
      where: { id, organizationId },
      include: {
        product: true,
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`Batch ${id} not found`);
    }

    return batch;
  }

  async updateBatch(
    organizationId: string,
    id: string,
    dto: UpdateBatchDto,
  ): Promise<Batch> {
    const existing = await this.prisma.batch.findUnique({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Batch ${id} not found`);
    }

    return this.prisma.batch.update({
      where: { id },
      data: dto,
    });
  }

  async retainBatch(
    organizationId: string,
    id: string,
    reason?: string,
  ): Promise<Batch> {
    return this.updateBatch(organizationId, id, {
      status: BatchStatus.RETENIDO,
    });
  }

  async releaseBatch(
    organizationId: string,
    id: string,
  ): Promise<Batch> {
    return this.updateBatch(organizationId, id, {
      status: BatchStatus.ACTIVO,
    });
  }

  async markAsExpired(
    organizationId: string,
    id: string,
  ): Promise<Batch> {
    return this.updateBatch(organizationId, id, {
      status: BatchStatus.VENCIDO,
    });
  }

  async getBatchStats(organizationId: string): Promise<any> {
    const batches = await this.prisma.batch.findMany({
      where: { organizationId },
      select: {
        status: true,
        currentQuantity: true,
        expirationDate: true,
      },
    });

    const stats = {
      total: batches.length,
      byStatus: {
        ACTIVO: 0,
        RETENIDO: 0,
        VENCIDO: 0,
        AGOTADO: 0,
      },
      expiringSoon: 0,
      expired: 0,
      totalValue: 0,
    };

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    batches.forEach((batch: any) => {
      const status = batch.status as keyof typeof stats.byStatus;
      if (status) {
        stats.byStatus[status]++;
      }

      if (batch.expirationDate) {
        if (batch.expirationDate < today) {
          stats.expired++;
        } else if (batch.expirationDate < thirtyDaysFromNow) {
          stats.expiringSoon++;
        }
      }

      stats.totalValue +=
        Number(batch.currentQuantity) * Number(batch.unitCost || 0);
    });

    return stats;
  }
}
