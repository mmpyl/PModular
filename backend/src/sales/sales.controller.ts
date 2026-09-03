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
import { SalesService } from './sales.service';
import {
  CreateSaleDto,
  UpdateSaleDto,
  ProcessPaymentDto,
  SaleStatus,
} from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('sales')
@UseGuards(JwtAuthGuard, TenantGuard, OrgRolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR')
  create(
    @Body() dto: CreateSaleDto,
    @CurrentOrg() orgId: string,
    @CurrentUser() user: any,
  ) {
    return this.salesService.create(orgId, user.sub, dto);
  }

  @Get()
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR', 'INVENTARIO')
  findAll(
    @CurrentOrg() orgId: string,
    @Query('status') status?: SaleStatus,
    @Query('customerId') customerId?: string,
  ) {
    return this.salesService.findAll(orgId, status, customerId);
  }

  @Get(':id')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR', 'INVENTARIO')
  findOne(@Param('id') id: string, @CurrentOrg() orgId: string) {
    return this.salesService.findOne(orgId, id);
  }

  @Patch(':id')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSaleDto,
    @CurrentOrg() orgId: string,
  ) {
    return this.salesService.update(orgId, id, dto);
  }

  @Post(':id/complete')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR')
  complete(
    @Param('id') id: string,
    @CurrentOrg() orgId: string,
    @CurrentUser() user: any,
  ) {
    return this.salesService.complete(orgId, user.sub, id);
  }

  @Post(':id/payment')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR')
  processPayment(
    @Param('id') id: string,
    @Body() dto: ProcessPaymentDto,
    @CurrentOrg() orgId: string,
    @CurrentUser() user: any,
  ) {
    return this.salesService.processPayment(orgId, user.sub, id, dto);
  }

  @Post(':id/cancel')
  @OrgRoles('OWNER', 'ADMIN')
  cancel(@Param('id') id: string, @CurrentOrg() orgId: string) {
    return this.salesService.cancel(orgId, id);
  }

  @Delete(':id')
  @OrgRoles('OWNER', 'ADMIN')
  remove(@Param('id') id: string, @CurrentOrg() orgId: string) {
    return this.salesService.remove(orgId, id);
  }
}
