import { Module } from '@nestjs/common';
import { ElectronicVoucherService } from './electronic-voucher.service';
import { ElectronicVoucherController } from './electronic-voucher.controller';
import { PseProviderModule } from '../pse-provider/pse-provider.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { VoucherArchiveModule } from '../voucher-archive/voucher-archive.module';

@Module({
  imports: [
    PseProviderModule,
    AuditLogModule,
    VoucherArchiveModule,
  ],
  controllers: [ElectronicVoucherController],
  providers: [ElectronicVoucherService],
  exports: [ElectronicVoucherService],
})
export class ElectronicVoucherModule {}
