<<<<<<< HEAD
import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { YapeQrService } from './yape-qr.service';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, YapeQrService],
=======
import { Module } from "@nestjs/common";
import {
  OrganizationsController,
  PlatformOrganizationsController,
} from "./organizations.controller";
import { OrganizationsService } from "./organizations.service";
import { PrismaModule } from "../prisma.module";
import { ModuleCatalogModule } from "../module-catalog/module-catalog.module";

@Module({
  imports: [PrismaModule, ModuleCatalogModule],
  controllers: [OrganizationsController, PlatformOrganizationsController],
  providers: [OrganizationsService],
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
