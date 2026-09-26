import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ModuleCatalogService } from "./module-catalog.service";

@Controller("module-catalog")
@UseGuards(JwtAuthGuard)
export class ModuleCatalogController {
  constructor(private readonly moduleCatalogService: ModuleCatalogService) {}

  @Get()
  findAll() {
    return this.moduleCatalogService.findAll();
  }
}
