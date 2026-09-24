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
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';

@Controller('organizations/:organizationId/fiscal-settings')
@UseGuards(JwtAuthGuard, TenantGuard, OrgRolesGuard)
export class OrganizationFiscalSettingsController {
  constructor(
    private readonly fiscalSettingsService: OrganizationFiscalSettingsService,
  ) {}

  // La configuración fiscal contiene datos sensibles ante SUNAT (RUC, credenciales
  // del PSE, certificado de firma). Solo OWNER/ADMIN pueden gestionarla.
  @Post()
  @OrgRoles('OWNER', 'ADMIN')
  async create(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateOrganizationFiscalSettingsDto,
  ) {
    return this.fiscalSettingsService.create(organizationId, dto);
  }

  @Get()
  @OrgRoles('OWNER', 'ADMIN')
  async findByOrganization(@Param('organizationId') organizationId: string) {
    const settings = await this.fiscalSettingsService.findByOrganization(organizationId);
    
    if (!settings) {
      return { message: 'No hay configuración fiscal registrada para esta organización', data: null };
    }
    
    return { data: settings };
  }

  @Put()
  @OrgRoles('OWNER', 'ADMIN')
  async update(
    @Param('organizationId') organizationId: string,
    @Body() dto: UpdateOrganizationFiscalSettingsDto,
  ) {
    return this.fiscalSettingsService.update(organizationId, dto);
  }

  @Post('/upsert')
  @OrgRoles('OWNER', 'ADMIN')
  async upsert(
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateOrganizationFiscalSettingsDto & Partial<UpdateOrganizationFiscalSettingsDto>,
  ) {
    return this.fiscalSettingsService.upsert(organizationId, dto);
  }

  @Delete()
  @OrgRoles('OWNER')
  async delete(@Param('organizationId') organizationId: string) {
    return this.fiscalSettingsService.delete(organizationId);
  }

  // El emisor de comprobantes electrónicos (rol VENDEDOR puede operar caja)
  // necesita obtener/avanzar el correlativo, pero sin exponer secretos:
  // este endpoint solo devuelve numeración.
  @Get('/next-correlativo/:tipoComprobante/:serie')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR')
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
