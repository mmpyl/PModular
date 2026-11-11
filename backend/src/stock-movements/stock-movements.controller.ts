import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { StockMovementService } from './stock-movements.service';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('stock-movements')
@UseGuards(JwtAuthGuard, TenantGuard, OrgRolesGuard)
export class StockMovementsController {
  constructor(private readonly stockMovementService: StockMovementService) {}

  @Post()
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async createMovement(
    @Request() req: any,
    @Body()
    dto: {
      productId: string;
      type: 'INGRESO' | 'SALIDA' | 'AJUSTE' | 'TRANSFERENCIA';
      reason: string;
      quantity: number;
      batchId?: string;
      referenceType?: string;
      referenceId?: string;
      notes?: string;
    },
  ) {
    const organizationId = req.organizationId;
    const performedBy = req.user?.sub || 'system';

    // Mapear el reason string al enum MovementReason
    const validReasons = [
      'COMPRA',
      'PRODUCCION',
      'DEVOLUCION_CLIENTE',
      'ENTRADA_INICIAL',
      'VENTA',
      'MERMA',
      'ROBO',
      'OBSOLETO',
      'CONSUMO_INTERNO',
      'CONTEO_FISICO',
      'ERROR_SISTEMA',
      'TRANSFERENCIA_ENTRADA',
      'TRANSFERENCIA_SALIDA',
    ];

    if (!validReasons.includes(dto.reason)) {
      throw new BadRequestException(`Invalid reason: ${dto.reason}`);
    }

    return this.stockMovementService.createStockMovement({
      ...dto,
      reason: dto.reason as any,
      organizationId,
      performedBy,
    });
  }

  @Get()
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR')
  async getMovements(
    @Request() req: any,
    @Query('productId') productId?: string,
    @Query('type') type?: string,
    @Query('reason') reason?: string,
    @Query('referenceType') referenceType?: string,
    @Query('referenceId') referenceId?: string,
  ) {
    const organizationId = req.organizationId;
    return this.stockMovementService.getMovements(organizationId, {
      productId,
      type,
      reason,
      referenceType,
      referenceId,
    });
  }

  @Get(':id')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR')
  async getMovementById(@Request() req: any, @Param('id') id: string) {
    const organizationId = req.organizationId;
    return this.stockMovementService.getMovementById(organizationId, id);
  }

  @Post('initial-stock')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async registerInitialStock(
    @Request() req: any,
    @Body()
    dto: {
      productId: string;
      quantity: number;
      unitCost: number;
      batchNumber?: string;
      expirationDate?: Date;
    },
  ) {
    const organizationId = req.organizationId;
    const performedBy = req.user?.sub || 'system';

    return this.stockMovementService.registerInitialStock(
      dto.productId,
      organizationId,
      dto.quantity,
      dto.unitCost,
      dto.batchNumber,
      dto.expirationDate ? new Date(dto.expirationDate) : undefined,
      performedBy,
    );
  }
}
