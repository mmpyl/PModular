import { Module } from '@nestjs/common';
import { ElectronicVoucherService } from './electronic-voucher.service';
import { ElectronicVoucherController } from './electronic-voucher.controller';
import { PseProviderModule } from '../pse-provider/pse-provider.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    PseProviderModule,
    AuditLogModule,
  ],
  controllers: [ElectronicVoucherController],
  providers: [ElectronicVoucherService],
  exports: [ElectronicVoucherService],
})
export class ElectronicVoucherModule {}
