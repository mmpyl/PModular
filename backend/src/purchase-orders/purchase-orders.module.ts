import { Module } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PrismaModule } from '../prisma.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  imports: [PrismaModule, InventoryModule],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
