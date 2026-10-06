import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ElectronicDocumentType } from '@prisma/client';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { IssueElectronicDocumentDto, SaveNubefactSettingsDto } from './dto/invoicing.dto';
import { InvoicingService } from './invoicing.service';

@Controller('billing')
@UseGuards(JwtAuthGuard, TenantGuard, OrgRolesGuard)
export class InvoicingController {
  constructor(private readonly invoicingService: InvoicingService) {}

  @Get('nubefact/settings')
  @OrgRoles('OWNER')
  getNubefactSettings(@CurrentOrg() organizationId: string) {
    return this.invoicingService.getNubefactSettings(organizationId);
  }

  @Put('nubefact/settings')
  @OrgRoles('OWNER')
  saveNubefactSettings(@CurrentOrg() organizationId: string, @Body() dto: SaveNubefactSettingsDto) {
    return this.invoicingService.saveNubefactSettings(organizationId, dto);
  }

  @Get('sales/:saleId/documents')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR', 'INVENTARIO')
  listSaleDocuments(@CurrentOrg() organizationId: string, @Param('saleId') saleId: string) {
    return this.invoicingService.listSaleDocuments(organizationId, saleId);
  }

  @Post('sales/:saleId/documents')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR')
  issueSaleDocument(
    @CurrentOrg() organizationId: string,
    @Param('saleId') saleId: string,
    @Body() dto: IssueElectronicDocumentDto,
  ) {
    return this.invoicingService.issueDocument(organizationId, saleId, dto.type);
  }
}