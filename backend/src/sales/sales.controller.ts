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
import { SalesService } from './sales.service';
import { CreateSaleDto, UpdateSaleDto, CompleteSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() createSaleDto: CreateSaleDto, @Request() req) {
    const userId = req.user.sub;
    const organizationId = req.user.organizationId;
    return this.salesService.create(createSaleDto, userId, organizationId);
  }

  @Get()
  findAll(@Request() req) {
    const organizationId = req.user.organizationId;
    return this.salesService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const organizationId = req.user.organizationId;
    return this.salesService.findOne(id, organizationId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSaleDto: UpdateSaleDto,
    @Request() req,
  ) {
    const organizationId = req.user.organizationId;
    return this.salesService.update(id, updateSaleDto, organizationId);
  }

  @Post(':id/complete')
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() completeSaleDto: CompleteSaleDto,
    @Request() req,
  ) {
    const userId = req.user.sub;
    const organizationId = req.user.organizationId;
    return this.salesService.complete(id, completeSaleDto, userId, organizationId);
  }

  @Post(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const organizationId = req.user.organizationId;
    return this.salesService.cancel(id, organizationId);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const organizationId = req.user.organizationId;
    return this.salesService.remove(id, organizationId);
  }
}
