import { Module } from '@nestjs/common';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { PromotionEngineService } from './promotion-engine.service';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PromotionsController],
  providers: [PromotionsService, PromotionEngineService],
  exports: [PromotionsService, PromotionEngineService],
})
export class PromotionsModule {}
