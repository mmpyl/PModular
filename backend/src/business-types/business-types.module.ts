import { Module } from '@nestjs/common';
import { BusinessTypesController } from './business-types.controller';
import { BusinessTypesService } from './business-types.service';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BusinessTypesController],
  providers: [BusinessTypesService],
  exports: [BusinessTypesService],
})
export class BusinessTypesModule {}
