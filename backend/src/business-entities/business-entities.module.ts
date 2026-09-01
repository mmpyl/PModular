import { Module } from '@nestjs/common';
import { BusinessEntitiesService } from './business-entities.service';
import { BusinessEntitiesController } from './business-entities.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  controllers: [BusinessEntitiesController],
  providers: [BusinessEntitiesService],
  imports: [PrismaModule],
  exports: [BusinessEntitiesService],
})
export class BusinessEntitiesModule {}
