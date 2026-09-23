import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OrganizationFiscalSettingsService } from './organization-fiscal-settings.service';
import { CreateOrganizationFiscalSettingsDto, UpdateOrganizationFiscalSettingsDto } from './dto/organization-fiscal-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';

@Controller('organizations/:organizationId/fiscal-settings')
@UseGuards(JwtAuthGuard, TenantGuard)
export class OrganizationFiscalSettingsController {
  constructor(
    private readonly fiscalSettingsService: OrganizationFiscalSettingsService,
  ) {}

  @Post()
  async create(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateOrganizationFiscalSettingsDto,
  ) {
    return this.fiscalSettingsService.create(organizationId, dto);
  }

  @Get()
  async findByOrganization(@Param('organizationId') organizationId: string) {
    const settings = await this.fiscalSettingsService.findByOrganization(organizationId);
    
    if (!settings) {
      return { message: 'No hay configuración fiscal registrada para esta organización', data: null };
    }
    
    return { data: settings };
  }

  @Put()
  async update(
    @Param('organizationId') organizationId: string,
    @Body() dto: UpdateOrganizationFiscalSettingsDto,
  ) {
    return this.fiscalSettingsService.update(organizationId, dto);
  }

  @Post('/upsert')
  async upsert(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateOrganizationFiscalSettingsDto & Partial<UpdateOrganizationFiscalSettingsDto>,
  ) {
    return this.fiscalSettingsService.upsert(organizationId, dto);
  }

  @Delete()
  async delete(@Param('organizationId') organizationId: string) {
    return this.fiscalSettingsService.delete(organizationId);
  }

  @Get('/next-correlativo/:tipoComprobante/:serie')
  async getNextCorrelativo(
    @Param('organizationId') organizationId: string,
    @Param('tipoComprobante') tipoComprobante: string,
    @Param('serie') serie: string,
  ) {
    const correlativo = await this.fiscalSettingsService.getNextCorrelativo(
      organizationId,
      tipoComprobante,
      serie,
    );

    return {
      tipoComprobante,
      serie,
      correlativo,
      numeroCompleto: `${serie}-${correlativo}`,
    };
  }
}
