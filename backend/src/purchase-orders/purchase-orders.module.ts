import { Module } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PrismaModule } from '../prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';

@Module({
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  imports: [PrismaModule, InventoryModule, StockMovementsModule],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
