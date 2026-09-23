import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountEntryDto, UpdateAccountEntryNotesDto } from './dto/account-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Fase B1 — Cuenta corriente / fiado formal.
 */
@Controller('account')
@UseGuards(JwtAuthGuard, TenantGuard, OrgRolesGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  /** Extracto de cuenta corriente con saldo corrido. */
  @Get('statement/:customerId')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR', 'CAJA')
  getStatement(
    @CurrentOrg() orgId: string,
    @Param('customerId') customerId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('includeVoided') includeVoided?: string,
  ) {
    return this.accountService.getStatement(orgId, customerId, {
      from,
      to,
      includeVoided: includeVoided === 'true',
    });
  }

  /** Deudores con vencimientos en mora. */
  @Get('overdue')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR', 'CAJA')
  getOverdue(@CurrentOrg() orgId: string) {
    return this.accountService.getOverdueAccounts(orgId);
  }

  /** Resumen de cartera (morosos, sobre límite, total por cobrar). */
  @Get('credit-summary')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR', 'CAJA')
  getCreditSummary(@CurrentOrg() orgId: string) {
    return this.accountService.getCreditSummary(orgId);
  }

  /** Asiento manual (ajuste / saldo inicial / abono suelto). */
  @Post('entries')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR')
  createEntry(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateAccountEntryDto,
  ) {
    return this.accountService.createManualEntry(orgId, user.sub, dto);
  }

  /** Anular un asiento (reversible, conserva trazabilidad). */
  @Post('entries/:id/void')
  @OrgRoles('OWNER', 'ADMIN')
  voidEntry(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.accountService.voidEntry(orgId, id);
  }

  @Patch('entries/:id')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR')
  updateEntry(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAccountEntryNotesDto,
  ) {
    return this.accountService.updateEntryNotes(orgId, id, dto);
  }
}
