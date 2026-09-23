import { Module } from '@nestjs/common';
import { VoucherArchiveService } from './voucher-archive.service';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  providers: [VoucherArchiveService],
  exports: [VoucherArchiveService],
})
export class VoucherArchiveModule {}
