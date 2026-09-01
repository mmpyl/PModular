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
import { CurrentOrg } from '../auth/decorators/org-roles.decorator';
import { CurrentUser } from '../auth/jwt-payload.type';

@Controller('purchase-orders')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  create(
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentOrg() orgId: string,
    @CurrentUser() user: any,
  ) {
    return this.purchaseOrdersService.create(orgId, user.sub, dto);
  }

  @Get()
  findAll(
    @CurrentOrg() orgId: string,
    @Query('status') status?: PurchaseOrderStatus,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.purchaseOrdersService.findAll(orgId, status, supplierId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentOrg() orgId: string) {
    return this.purchaseOrdersService.findOne(orgId, id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
    @CurrentOrg() orgId: string,
  ) {
    return this.purchaseOrdersService.update(orgId, id, dto);
  }

  @Post(':id/receive')
  receive(
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseOrderDto,
    @CurrentOrg() orgId: string,
    @CurrentUser() user: any,
  ) {
    return this.purchaseOrdersService.receive(orgId, user.sub, id, dto);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentOrg() orgId: string) {
    return this.purchaseOrdersService.cancel(orgId, id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentOrg() orgId: string) {
    return this.purchaseOrdersService.remove(orgId, id);
  }
}
