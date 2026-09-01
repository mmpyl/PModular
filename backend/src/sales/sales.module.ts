import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { SalesRepository } from './repositories/sales.repository';
import { PrismaModule } from '../prisma.module';

@Module({
  controllers: [SalesController],
  providers: [SalesService, SalesRepository],
  imports: [PrismaModule],
  exports: [SalesService],
})
export class SalesModule {}
