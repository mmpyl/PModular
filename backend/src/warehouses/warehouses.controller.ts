import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto, UpdateWarehouseDto, CreateStockTransferDto, CompleteStockTransferDto } from './dto/create-warehouse.dto';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('warehouses')
@UseGuards(JwtAuthGuard, TenantGuard, OrgRolesGuard)
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR')
  async findAll(@Request() req: any) {
    const organizationId = req.organizationId;
    return this.warehousesService.findAll(organizationId);
  }

  @Get(':id')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const organizationId = req.organizationId;
    return this.warehousesService.findOne(id, organizationId);
  }

  @Post()
  @OrgRoles('OWNER', 'ADMIN')
  async create(@Request() req: any, @Body() dto: CreateWarehouseDto) {
    const organizationId = req.organizationId;
    return this.warehousesService.create(organizationId, dto);
  }

  @Patch(':id')
  @OrgRoles('OWNER', 'ADMIN')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseDto,
  ) {
    const organizationId = req.organizationId;
    return this.warehousesService.update(id, organizationId, dto);
  }

  @Delete(':id')
  @OrgRoles('OWNER', 'ADMIN')
  async remove(@Request() req: any, @Param('id') id: string) {
    const organizationId = req.organizationId;
    return this.warehousesService.remove(id, organizationId);
  }

  @Post(':fromWarehouseId/transfer')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async transferStock(
    @Request() req: any,
    @Param('fromWarehouseId') fromWarehouseId: string,
    @Body() dto: CreateStockTransferDto,
  ) {
    const organizationId = req.organizationId;
    const performedBy = req.user?.sub || 'system';
    return this.warehousesService.transferStock(
      fromWarehouseId,
      organizationId,
      dto,
      performedBy,
    );
  }

  @Post('transfers/:id/complete')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async completeTransfer(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: CompleteStockTransferDto,
  ) {
    const organizationId = req.organizationId;
    const performedBy = req.user?.sub || 'system';
    return this.warehousesService.completeTransfer(id, organizationId, dto, performedBy);
  }

  @Get('transfers')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async getTransfers(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('fromWarehouseId') fromWarehouseId?: string,
    @Query('toWarehouseId') toWarehouseId?: string,
  ) {
    const organizationId = req.organizationId;
    return this.warehousesService.getTransfers(organizationId, {
      status,
      fromWarehouseId,
      toWarehouseId,
    });
  }

  @Get('transfers/:id')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async getTransferById(@Request() req: any, @Param('id') id: string) {
    const organizationId = req.organizationId;
    return this.warehousesService.getTransferById(id, organizationId);
  }
}
