import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';

@Controller('inventory')
@UseGuards(TenantGuard, OrgRolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR')
  async getInventory(
    @Request() req: any,
    @Query('productId') productId?: string,
  ) {
    const organizationId = req.organizationId;
    return this.inventoryService.getInventory(organizationId, productId);
  }

  @Get(':id')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR')
  async getInventoryById(@Request() req: any, @Param('id') id: string) {
    const organizationId = req.organizationId;
    return this.inventoryService.getInventoryById(organizationId, id);
  }

  @Patch(':id')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async updateInventory(
    @Request() req: any,
    @Param('id') id: string,
    @Query() dto: any,
  ) {
    const organizationId = req.organizationId;
    const updateData: any = {};
    
    if (dto.quantity !== undefined) {
      updateData.quantity = parseFloat(dto.quantity);
    }
    if (dto.reserved !== undefined) {
      updateData.reserved = parseFloat(dto.reserved);
    }
    if (dto.averageCost !== undefined) {
      updateData.averageCost = parseFloat(dto.averageCost);
    }
    
    return this.inventoryService.updateInventory(organizationId, id, updateData);
  }

  @Post('recalculate/:productId')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async recalculateInventory(
    @Request() req: any,
    @Param('productId') productId: string,
  ) {
    const organizationId = req.organizationId;
    
    // Asegura que exista el item de inventario
    await this.inventoryService.ensureInventoryItem(productId, organizationId);
    
    return this.inventoryService.recalculateInventory(productId, organizationId);
  }

  @Get('alerts/low-stock')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async getLowStock(
    @Request() req: any,
    @Query('threshold') threshold?: string,
  ) {
    const organizationId = req.organizationId;
    const thresholdNum = threshold ? parseInt(threshold, 10) : 10;
    return this.inventoryService.getLowStockItems(organizationId, thresholdNum);
  }

  @Get('alerts/expiring')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async getExpiringBatches(
    @Request() req: any,
    @Query('days') days?: string,
  ) {
    const organizationId = req.organizationId;
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.inventoryService.getExpiringBatches(organizationId, daysNum);
  }
}
