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

interface AuthRequest extends Request {
  user: {
    sub: string;
    email: string;
    organizationId?: string;
    orgRole?: string;
  };
}

@Controller('cash-registers')
@UseGuards(JwtAuthGuard)
export class CashRegistersController {
  constructor(private readonly cashRegistersService: CashRegistersService) {}

  @Post()
  create(@Body() createCashRegisterDto: CreateCashRegisterDto, @Request() req: AuthRequest) {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.cashRegistersService.create(createCashRegisterDto, organizationId);
  }

  @Get()
  findAll(@Request() req: AuthRequest) {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.cashRegistersService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthRequest) {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.cashRegistersService.findOne(id, organizationId);
  }

  @Get(':id/movements')
  getMovements(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthRequest) {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.cashRegistersService.getMovements(id, organizationId);
  }

  @Patch(':id')
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
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthRequest) {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organization ID is required');
    }
    return this.cashRegistersService.remove(id, organizationId);
  }
}
