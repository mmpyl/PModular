import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { CashRegistersService } from './cash-registers.service';
import {
  CreateCashRegisterDto,
  UpdateCashRegisterDto,
  OpenCashRegisterDto,
  CloseCashRegisterDto,
  CreateCashRegisterMovementDto,
} from './dto/create-cash-register.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { OrgRolesGuard } from '../auth/guards/org-roles.guard';
import { OrgRoles } from '../auth/decorators/org-roles.decorator';

interface AuthRequest extends Request {
  user: {
    sub: string;
    email: string;
    organizationId?: string;
    orgRole?: string;
  };
}

@Controller('cash-registers')
@UseGuards(JwtAuthGuard, TenantGuard, OrgRolesGuard)
export class CashRegistersController {
  constructor(private readonly cashRegistersService: CashRegistersService) {}

  @Post()
  @OrgRoles('OWNER', 'ADMIN')
  create(@Body() createCashRegisterDto: CreateCashRegisterDto, @Request() req: AuthRequest) {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.cashRegistersService.create(createCashRegisterDto, organizationId);
  }

  @Get()
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR')
  findAll(@Request() req: AuthRequest) {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.cashRegistersService.findAll(organizationId);
  }

  @Get(':id')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthRequest) {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.cashRegistersService.findOne(id, organizationId);
  }

  @Get(':id/movements')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR')
  getMovements(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthRequest) {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.cashRegistersService.getMovements(id, organizationId);
  }

  @Patch(':id')
  @OrgRoles('OWNER', 'ADMIN')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCashRegisterDto: UpdateCashRegisterDto,
    @Request() req: AuthRequest,
  ) {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.cashRegistersService.update(id, updateCashRegisterDto, organizationId);
  }

  @Post(':id/open')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR')
  open(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() openCashRegisterDto: OpenCashRegisterDto,
    @Request() req: AuthRequest,
  ) {
    const userId = req.user.sub;
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.cashRegistersService.open(id, openCashRegisterDto, userId, organizationId);
  }

  @Post(':id/close')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR')
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() closeCashRegisterDto: CloseCashRegisterDto,
    @Request() req: AuthRequest,
  ) {
    const userId = req.user.sub;
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.cashRegistersService.close(id, closeCashRegisterDto, userId, organizationId);
  }

  @Post(':id/movements')
  @OrgRoles('OWNER', 'ADMIN', 'VENDEDOR')
  addMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createMovementDto: CreateCashRegisterMovementDto,
    @Request() req: AuthRequest,
  ) {
    const userId = req.user.sub;
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.cashRegistersService.addMovement(id, createMovementDto, userId, organizationId);
  }

  @Delete(':id')
  @OrgRoles('OWNER', 'ADMIN')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthRequest) {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.cashRegistersService.remove(id, organizationId);
  }
}
