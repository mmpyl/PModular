import { Module } from '@nestjs/common';
import { ShrinkageController } from './shrinkage.controller';
import { ShrinkageService } from './shrinkage.service';
import { PrismaModule } from '../prisma.module';
import { StockMovementsModule } from '../stock-movements/stock-movements.module';

@Module({
  imports: [PrismaModule, StockMovementsModule],
  controllers: [ShrinkageController],
  providers: [ShrinkageService],
  exports: [ShrinkageService],
})
export class ShrinkageModule {}
