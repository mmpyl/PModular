import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PrismaModule } from '../prisma.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  controllers: [SalesController],
  providers: [SalesService],
  imports: [PrismaModule, InventoryModule],
  exports: [SalesService],
})
export class SalesModule {}
