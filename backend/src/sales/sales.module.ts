import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PrismaModule } from '../prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CashRegistersModule } from '../cash-registers/cash-registers.module';

@Module({
  controllers: [SalesController],
  providers: [SalesService],
  imports: [PrismaModule, InventoryModule, CashRegistersModule],
  exports: [SalesService],
})
export class SalesModule {}
