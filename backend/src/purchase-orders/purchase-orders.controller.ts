import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  PurchaseOrderStatus,
} from './dto/create-purchase-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('purchase-orders')
@UseGuards(JwtAuthGuard, TenantGuard, OrgRolesGuard)
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  create(
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentOrg() orgId: string,
    @CurrentUser() user: any,
  ) {
    return this.purchaseOrdersService.create(orgId, user.sub, dto);
  }

  @Get()
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR')
  findAll(
    @CurrentOrg() orgId: string,
    @Query('status') status?: PurchaseOrderStatus,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.purchaseOrdersService.findAll(orgId, status, supplierId);
  }

  @Get(':id')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR')
  findOne(@Param('id') id: string, @CurrentOrg() orgId: string) {
    return this.purchaseOrdersService.findOne(orgId, id);
  }

  @Patch(':id')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
    @CurrentOrg() orgId: string,
  ) {
    return this.purchaseOrdersService.update(orgId, id, dto);
  }

  @Post(':id/receive')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  receive(
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseOrderDto,
    @CurrentOrg() orgId: string,
    @CurrentUser() user: any,
  ) {
    return this.purchaseOrdersService.receive(orgId, user.sub, id, dto);
  }

  @Post(':id/cancel')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  cancel(@Param('id') id: string, @CurrentOrg() orgId: string) {
    return this.purchaseOrdersService.cancel(orgId, id);
  }

  @Delete(':id')
  @OrgRoles('OWNER', 'ADMIN')
  remove(@Param('id') id: string, @CurrentOrg() orgId: string) {
    return this.purchaseOrdersService.remove(orgId, id);
  }
}
