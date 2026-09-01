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

@Controller('cash-registers')
@UseGuards(JwtAuthGuard)
export class CashRegistersController {
  constructor(private readonly cashRegistersService: CashRegistersService) {}

  @Post()
  create(@Body() createCashRegisterDto: CreateCashRegisterDto, @Request() req) {
    const organizationId = req.user.organizationId;
    return this.cashRegistersService.create(createCashRegisterDto, organizationId);
  }

  @Get()
  findAll(@Request() req) {
    const organizationId = req.user.organizationId;
    return this.cashRegistersService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const organizationId = req.user.organizationId;
    return this.cashRegistersService.findOne(id, organizationId);
  }

  @Get(':id/movements')
  getMovements(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const organizationId = req.user.organizationId;
    return this.cashRegistersService.getMovements(id, organizationId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCashRegisterDto: UpdateCashRegisterDto,
    @Request() req,
  ) {
    const organizationId = req.user.organizationId;
    return this.cashRegistersService.update(id, updateCashRegisterDto, organizationId);
  }

  @Post(':id/open')
  open(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() openCashRegisterDto: OpenCashRegisterDto,
    @Request() req,
  ) {
    const userId = req.user.sub;
    const organizationId = req.user.organizationId;
    return this.cashRegistersService.open(id, openCashRegisterDto, userId, organizationId);
  }

  @Post(':id/close')
  close(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() closeCashRegisterDto: CloseCashRegisterDto,
    @Request() req,
  ) {
    const userId = req.user.sub;
    const organizationId = req.user.organizationId;
    return this.cashRegistersService.close(id, closeCashRegisterDto, userId, organizationId);
  }

  @Post(':id/movements')
  addMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createMovementDto: CreateCashRegisterMovementDto,
    @Request() req,
  ) {
    const userId = req.user.sub;
    const organizationId = req.user.organizationId;
    return this.cashRegistersService.addMovement(id, createMovementDto, userId, organizationId);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const organizationId = req.user.organizationId;
    return this.cashRegistersService.remove(id, organizationId);
  }
}
