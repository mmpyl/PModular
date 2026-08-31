import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  CreateMovementDto,
  CreateAdjustmentDto,
} from '../dto/inventory.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import { OrgRolesGuard } from '../../auth/guards/org-roles.guard';
import { OrgRoles } from '../../auth/decorators/roles.decorator';
import { OrgRole } from '@prisma/client';

export const RequiredOrgRole = (...roles: OrgRole[]) => OrgRoles(...roles);

@Controller('inventory')
@UseGuards(JwtAuthGuard, TenantGuard, OrgRolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ==========================================
  // Warehouse Endpoints
  // ==========================================

  @Post('warehouses')
  @RequiredOrgRole(OrgRole.ADMIN, OrgRole.OWNER, OrgRole.INVENTARIO)
  async createWarehouse(@Request() req: any, @Body() dto: CreateWarehouseDto) {
    const organizationId = req.user.organizationId;
    return this.inventoryService.createWarehouse(organizationId, dto);
  }

  @Get('warehouses')
  @RequiredOrgRole(OrgRole.ADMIN, OrgRole.OWNER, OrgRole.INVENTARIO, OrgRole.VENDEDOR)
  async findAllWarehouses(@Request() req: any) {
    const organizationId = req.user.organizationId;
    return this.inventoryService.findAllWarehouses(organizationId);
  }

  @Get('warehouses/:id')
  @RequiredOrgRole(OrgRole.ADMIN, OrgRole.OWNER, OrgRole.INVENTARIO, OrgRole.VENDEDOR)
  async findWarehouseById(@Request() req: any, @Param('id') id: string) {
    const organizationId = req.user.organizationId;
    return this.inventoryService.findWarehouseById(organizationId, id);
  }

  @Put('warehouses/:id')
  @RequiredOrgRole(OrgRole.ADMIN, OrgRole.OWNER, OrgRole.INVENTARIO)
  async updateWarehouse(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseDto,
  ) {
    const organizationId = req.user.organizationId;
    return this.inventoryService.updateWarehouse(organizationId, id, dto);
  }

  @Delete('warehouses/:id')
  @RequiredOrgRole(OrgRole.ADMIN, OrgRole.OWNER)
  async deleteWarehouse(@Request() req: any, @Param('id') id: string) {
    const organizationId = req.user.organizationId;
    return this.inventoryService.deleteWarehouse(organizationId, id);
  }

  // ==========================================
  // Stock Endpoints
  // ==========================================

  @Get('stock/product/:productId')
  @RequiredOrgRole(OrgRole.ADMIN, OrgRole.OWNER, OrgRole.INVENTARIO, OrgRole.VENDEDOR)
  async getStockByProduct(@Request() req: any, @Param('productId') productId: string) {
    const organizationId = req.user.organizationId;
    return this.inventoryService.getStockByProduct(organizationId, productId);
  }

  @Get('stock/summary')
  @RequiredOrgRole(OrgRole.ADMIN, OrgRole.OWNER, OrgRole.INVENTARIO)
  async getInventorySummary(@Request() req: any) {
    const organizationId = req.user.organizationId;
    return this.inventoryService.getInventorySummary(organizationId);
  }

  @Post('stock/initialize')
  @RequiredOrgRole(OrgRole.ADMIN, OrgRole.OWNER, OrgRole.INVENTARIO)
  async initializeStock(
    @Request() req: any,
    @Body() body: { productId: string; warehouseId: string; quantity: number },
  ) {
    const organizationId = req.user.organizationId;
    const userId = req.user.userId;
    return this.inventoryService.initializeStockForProduct(
      organizationId,
      body.productId,
      body.warehouseId,
      body.quantity,
      userId,
    );
  }

  // ==========================================
  // Movement Endpoints
  // ==========================================

  @Post('movements')
  @RequiredOrgRole(OrgRole.ADMIN, OrgRole.OWNER, OrgRole.INVENTARIO)
  async registerMovement(@Request() req: any, @Body() dto: CreateMovementDto) {
    const organizationId = req.user.organizationId;
    const userId = req.user.userId;
    return this.inventoryService.registerMovement(organizationId, dto, userId);
  }

  @Get('movements')
  @RequiredOrgRole(OrgRole.ADMIN, OrgRole.OWNER, OrgRole.INVENTARIO)
  async getMovements(
    @Request() req: any,
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('movementType') movementType?: any,
    @Query('referenceId') referenceId?: string,
  ) {
    const organizationId = req.user.organizationId;
    const filters: any = {};
    
    if (productId) filters.productId = productId;
    if (warehouseId) filters.warehouseId = warehouseId;
    if (movementType) filters.movementType = movementType;
    if (referenceId) filters.referenceId = referenceId;
    
    return this.inventoryService.getMovements(organizationId, filters);
  }

  // ==========================================
  // Adjustment Endpoints
  // ==========================================

  @Post('adjustments')
  @RequiredOrgRole(OrgRole.ADMIN, OrgRole.OWNER, OrgRole.INVENTARIO)
  async createAdjustment(@Request() req: any, @Body() dto: CreateAdjustmentDto) {
    const organizationId = req.user.organizationId;
    const userId = req.user.userId;
    return this.inventoryService.createAdjustment(organizationId, dto, userId);
  }

  @Get('adjustments')
  @RequiredOrgRole(OrgRole.ADMIN, OrgRole.OWNER, OrgRole.INVENTARIO)
  async getAdjustments(
    @Request() req: any,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: any,
  ) {
    const organizationId = req.user.organizationId;
    const filters: any = {};
    
    if (warehouseId) filters.warehouseId = warehouseId;
    if (status) filters.status = status;
    
    return this.inventoryService.getAdjustments(organizationId, filters);
  }

  @Get('adjustments/:id')
  @RequiredOrgRole(OrgRole.ADMIN, OrgRole.OWNER, OrgRole.INVENTARIO)
  async getAdjustmentById(@Request() req: any, @Param('id') id: string) {
    const organizationId = req.user.organizationId;
    return this.inventoryService.getAdjustmentById(organizationId, id);
  }

  @Post('adjustments/:id/approve')
  @RequiredOrgRole(OrgRole.ADMIN, OrgRole.OWNER)
  async approveAdjustment(@Request() req: any, @Param('id') id: string) {
    const organizationId = req.user.organizationId;
    const userId = req.user.userId;
    return this.inventoryService.approveAdjustment(organizationId, id, userId);
  }

  @Post('adjustments/:id/reject')
  @RequiredOrgRole(OrgRole.ADMIN, OrgRole.OWNER)
  async rejectAdjustment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { rejectionReason?: string },
  ) {
    const organizationId = req.user.organizationId;
    const userId = req.user.userId;
    return this.inventoryService.rejectAdjustment(
      organizationId,
      id,
      userId,
      body.rejectionReason,
    );
  }
}
