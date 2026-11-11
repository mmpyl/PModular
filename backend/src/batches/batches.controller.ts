import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BatchesService } from './batches.service';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BatchStatus } from '@prisma/client';

@Controller('batches')
@UseGuards(JwtAuthGuard, TenantGuard, OrgRolesGuard)
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async createBatch(
    @Request() req: any,
    @Body()
    dto: {
      productId: string;
      batchNumber: string;
      serialNumber?: string;
      manufacturingDate?: Date;
      expirationDate?: Date;
      initialQuantity: number;
      unitCost: number;
      location?: string;
    },
  ) {
    const organizationId = req.organizationId;
    return this.batchesService.createBatch({
      ...dto,
      organizationId,
    });
  }

  @Get()
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR')
  async getBatches(
    @Request() req: any,
    @Query('productId') productId?: string,
    @Query('status') status?: BatchStatus,
    @Query('expiringSoon') expiringSoon?: string,
    @Query('days') days?: string,
  ) {
    const organizationId = req.organizationId;
    return this.batchesService.getBatches(organizationId, {
      productId,
      status,
      expiringSoon: expiringSoon === 'true',
      daysThreshold: days ? parseInt(days, 10) : 30,
    });
  }

  @Get(':id')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR')
  async getBatchById(@Request() req: any, @Param('id') id: string) {
    const organizationId = req.organizationId;
    return this.batchesService.getBatchById(organizationId, id);
  }

  @Patch(':id')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async updateBatch(
    @Request() req: any,
    @Param('id') id: string,
    @Body()
    dto: {
      status?: BatchStatus;
      location?: string;
      expirationDate?: Date;
    },
  ) {
    const organizationId = req.organizationId;
    return this.batchesService.updateBatch(organizationId, id, dto);
  }

  @Post(':id/retain')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async retainBatch(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    const organizationId = req.organizationId;
    return this.batchesService.retainBatch(organizationId, id, body.reason);
  }

  @Post(':id/release')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async releaseBatch(@Request() req: any, @Param('id') id: string) {
    const organizationId = req.organizationId;
    return this.batchesService.releaseBatch(organizationId, id);
  }

  @Post(':id/expire')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async markAsExpired(@Request() req: any, @Param('id') id: string) {
    const organizationId = req.organizationId;
    return this.batchesService.markAsExpired(organizationId, id);
  }

  @Get('stats/summary')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async getBatchStats(@Request() req: any) {
    const organizationId = req.organizationId;
    return this.batchesService.getBatchStats(organizationId);
  }
}
