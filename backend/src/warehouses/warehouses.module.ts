import { Module } from '@nestjs/common';
import { WarehousesController } from './warehouses.controller';
import { WarehousesService } from './warehouses.service';
import { PrismaModule } from '../prisma.module';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';

@Module({
  imports: [PrismaModule, StockMovementsModule],
  controllers: [WarehousesController],
  providers: [WarehousesService],
  exports: [WarehousesService],
})
export class WarehousesModule {}
