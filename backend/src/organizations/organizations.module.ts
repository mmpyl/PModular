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
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
