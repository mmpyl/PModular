import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PrismaModule } from '../prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';

@Module({
  controllers: [SalesController],
  providers: [SalesService],
  imports: [PrismaModule, InventoryModule, StockMovementsModule],
  exports: [SalesService],
})
export class SalesModule {}
