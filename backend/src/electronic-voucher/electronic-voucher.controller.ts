import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ElectronicVoucherService } from './electronic-voucher.service';
import { CreateInvoiceDto, UpdateInvoiceStatusDto, CancelInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('electronic-vouchers')
@UseGuards(JwtAuthGuard)
export class ElectronicVoucherController {
  constructor(private readonly electronicVoucherService: ElectronicVoucherService) {}

  /**
   * Genera comprobante electrónico desde una venta cerrada
   */
  @Post('from-sale/:saleId')
  async createFromSale(
    @Param('saleId') saleId: string,
    @Query('userId') userId: string,
  ) {
    return this.electronicVoucherService.createFromSale(saleId, userId);
  }

  /**
   * Envía comprobante a SUNAT/PSE
   */
  @Post(':id/send')
  async sendToPSE(@Param('id') id: string) {
    return this.electronicVoucherService.sendToPSE(id);
  }

  /**
   * Anula un comprobante electrónico
   */
  @Post(':id/cancel')
  async cancelInvoice(
    @Param('id') id: string,
    @Body() dto: CancelInvoiceDto,
    @Query('userId') userId: string,
  ) {
    return this.electronicVoucherService.cancelInvoice(id, dto.motivoAnulacion, userId);
  }

  /**
   * Obtiene todos los comprobantes de una organización
   */
  @Get()
  async findAll(
    @Query('organizationId') organizationId: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    // Implementación pendiente - requiere PrismaService inyectado
    return { message: 'Endpoint en desarrollo' };
  }

  /**
   * Obtiene un comprobante por ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    // Implementación pendiente
    return { message: 'Endpoint en desarrollo' };
  }

  /**
   * Descarga el XML del comprobante
   */
  @Get(':id/xml')
  async downloadXML(@Param('id') id: string) {
    // Implementación pendiente
    return { message: 'Endpoint en desarrollo' };
  }

  /**
   * Descarga el CDR (Constancia de Recepción)
   */
  @Get(':id/cdr')
  async downloadCDR(@Param('id') id: string) {
    // Implementación pendiente
    return { message: 'Endpoint en desarrollo' };
  }
}
