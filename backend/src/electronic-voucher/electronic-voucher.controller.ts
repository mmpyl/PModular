import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ElectronicVoucherService } from './electronic-voucher.service';
import {
  CancelInvoiceDto,
  ListInvoicesQueryDto,
} from './dto/create-invoice.dto';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * FASE B5: Comprobantes fiscales electrónicos (boleta / factura).
 *
 * Flujo: venta cerrada -> emisión (serie/correlativo SUNAT) -> envío al
 * PSE/OSE -> CDR -> archivo con retención de 5 años.
 */
@Controller('electronic-vouchers')
@UseGuards(JwtAuthGuard, TenantGuard, OrgRolesGuard)
export class ElectronicVoucherController {
  constructor(private readonly electronicVoucherService: ElectronicVoucherService) {}

  /** Genera comprobante electrónico (boleta/factura) desde una venta cerrada */
  @Post('from-sale/:saleId')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR', 'CAJA')
  async createFromSale(
    @Param('saleId') saleId: string,
    @CurrentUser() user: any,
  ) {
    const issuedBy = user?.sub || user?.id || 'system';
    return this.electronicVoucherService.createFromSale(saleId, issuedBy);
  }

  /** Emite y envía a SUNAT en un solo paso (flujo POS/mostrador) */
  @Post('issue/:saleId')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR', 'CAJA')
  async issueFromSale(
    @Param('saleId') saleId: string,
    @CurrentUser() user: any,
  ) {
    const issuedBy = user?.sub || user?.id || 'system';
    return this.electronicVoucherService.issueFromSale(saleId, issuedBy);
  }

  /** Envía un comprobante pendiente al PSE/SUNAT */
  @Post(':id/send')
  @OrgRoles('OWNER', 'ADMIN', 'CAJA')
  async sendToPSE(@Param('id') id: string) {
    return this.electronicVoucherService.sendToPSE(id);
  }

  /** Reintenta el envío de un comprobante rechazado */
  @Post(':id/retry')
  @OrgRoles('OWNER', 'ADMIN', 'CAJA')
  async retrySend(@Param('id') id: string) {
    return this.electronicVoucherService.retrySend(id);
  }

  /** Anula un comprobante aceptado (emite nota de crédito de baja) */
  @Post(':id/cancel')
  @OrgRoles('OWNER', 'ADMIN')
  async cancelInvoice(
    @Param('id') id: string,
    @Body() dto: CancelInvoiceDto,
    @CurrentUser() user: any,
  ) {
    const issuedBy = user?.sub || user?.id || 'system';
    return this.electronicVoucherService.cancelInvoice(id, dto.motivoAnulacion, issuedBy);
  }

  /** Estadísticas de comprobantes por estado/tipo */
  @Get('stats')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR', 'CAJA')
  async getStats(@CurrentOrg() organizationId: string) {
    return this.electronicVoucherService.getStats(organizationId);
  }

  /** Lista comprobantes de la organización (filtros + paginación) */
  @Get()
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR', 'CAJA')
  async findAll(
    @CurrentOrg() organizationId: string,
    @Query() query: ListInvoicesQueryDto,
  ) {
    return this.electronicVoucherService.findAll(organizationId, {
      ...query,
      organizationId,
    });
  }

  /** Detalle de un comprobante */
  @Get(':id')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR', 'CAJA')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const userId = user?.sub || user?.id;
    return this.electronicVoucherService.findOne(id, userId);
  }

  /** Verifica integridad del XML archivado (hash SHA-256) */
  @Get(':id/integrity')
  @OrgRoles('OWNER', 'ADMIN')
  async verifyIntegrity(@Param('id') id: string) {
    return this.electronicVoucherService.verifyIntegrity(id);
  }

  /** Descarga el XML del comprobante */
  @Get(':id/xml')
  @Header('Content-Type', 'application/xml')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR', 'CAJA')
  async downloadXML(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const userId = user?.sub || user?.id || 'system';
    const file = await this.electronicVoucherService.downloadXML(id, userId);
    res.set('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.content);
  }

  /** Descarga el CDR (Constancia de Recepción SUNAT) */
  @Get(':id/cdr')
  @Header('Content-Type', 'application/xml')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR', 'CAJA')
  async downloadCDR(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const userId = user?.sub || user?.id || 'system';
    const file = await this.electronicVoucherService.downloadCDR(id, userId);
    res.set('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.content);
  }
}
