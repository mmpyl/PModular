import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ShrinkageService } from './shrinkage.service';
import {
  CreateShrinkageRecordDto,
  ExpirationAlertsQueryDto,
  ShrinkageQueryDto,
} from './dto/shrinkage.dto';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * FASE B2: Control de mermas y vencimientos.
 *
 * Pensado para productos perecibles (lácteos, pan, embutidos) que requieren
 * trazabilidad de vencimiento por lote y registro formal de pérdidas.
 * Reutiliza el módulo de batches (antes activo solo para Farmacia).
 */
@Controller('shrinkage')
@UseGuards(JwtAuthGuard, TenantGuard, OrgRolesGuard)
export class ShrinkageController {
  constructor(private readonly shrinkageService: ShrinkageService) {}

  /** Registrar una merma/pérdida (descuenta stock con trazabilidad por lote) */
  @Post()
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async createShrinkageRecord(
    @CurrentOrg() organizationId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateShrinkageRecordDto,
  ) {
    const performedBy = user?.sub || user?.id || 'system';
    return this.shrinkageService.createShrinkageRecord(
      organizationId,
      dto,
      performedBy,
    );
  }

  /** Listar registros de merma con filtros (producto, lote, motivo, fechas) */
  @Get()
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR')
  async listShrinkageRecords(
    @CurrentOrg() organizationId: string,
    @Query() query: ShrinkageQueryDto,
  ) {
    return this.shrinkageService.listShrinkageRecords(organizationId, query);
  }

  /** Resumen de pérdidas (por defecto últimos 30 días) */
  @Get('summary')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async getShrinkageSummary(
    @CurrentOrg() organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.shrinkageService.getShrinkageSummary(
      organizationId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /** Alertas de vencimiento: lotes vencidos y próximos a vencer */
  @Get('expiration-alerts')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR')
  async getExpirationAlerts(
    @CurrentOrg() organizationId: string,
    @Query() query: ExpirationAlertsQueryDto,
  ) {
    return this.shrinkageService.getExpirationAlerts(
      organizationId,
      query.days ?? 7,
      query.includeExpired !== false,
    );
  }

  /** Detalle de un registro de merma */
  @Get(':id')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO', 'VENDEDOR')
  async getShrinkageRecordById(
    @CurrentOrg() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.shrinkageService.getShrinkageRecordById(organizationId, id);
  }

  /**
   * Job de control de vencimientos: marca VENCIDO los lotes con fecha
   * superada. Invocable manualmente o desde un cron diario.
   */
  @Post('expire-batches')
  @OrgRoles('OWNER', 'ADMIN', 'INVENTARIO')
  async expireBatches(@CurrentOrg() organizationId: string) {
    const count = await this.shrinkageService.autoExpireBatches(organizationId);
    return { expiredBatches: count };
  }
}
