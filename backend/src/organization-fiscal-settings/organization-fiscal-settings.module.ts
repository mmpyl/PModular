import { Module } from '@nestjs/common';
import { OrganizationFiscalSettingsController } from './organization-fiscal-settings.controller';
import { OrganizationFiscalSettingsService } from './organization-fiscal-settings.service';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrganizationFiscalSettingsController],
  providers: [OrganizationFiscalSettingsService],
  exports: [OrganizationFiscalSettingsService],
})
export class OrganizationFiscalSettingsModule {}
