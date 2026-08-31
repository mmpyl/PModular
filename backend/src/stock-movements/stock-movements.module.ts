import { Module } from '@nestjs/common';
import { StockMovementsController } from './stock-movements.controller';
import { StockMovementService } from './stock-movements.service';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StockMovementsController],
  providers: [StockMovementService],
  exports: [StockMovementService],
})
export class StockMovementsModule {}
