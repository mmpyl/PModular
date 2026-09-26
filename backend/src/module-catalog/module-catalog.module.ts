import { Module } from "@nestjs/common";
import { ModuleCatalogController } from "./module-catalog.controller";
import { ModuleCatalogService } from "./module-catalog.service";

@Module({
  controllers: [ModuleCatalogController],
  providers: [ModuleCatalogService],
  exports: [ModuleCatalogService],
})
export class ModuleCatalogModule {}
