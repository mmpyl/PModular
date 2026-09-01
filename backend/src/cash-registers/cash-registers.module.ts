import { Module } from '@nestjs/common';
import { CashRegistersController } from './cash-registers.controller';
import { CashRegistersService } from './cash-registers.service';
import { CashRegistersRepository } from './repositories/cash-registers.repository';
import { PrismaModule } from '../prisma.module';

@Module({
  controllers: [CashRegistersController],
  providers: [CashRegistersService, CashRegistersRepository],
  imports: [PrismaModule],
  exports: [CashRegistersService],
})
export class CashRegistersModule {}
