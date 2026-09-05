import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PrismaModule } from '../prisma.module';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';

@Module({
  imports: [PrismaModule, StockMovementsModule],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
