import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BusinessEntitiesService } from './business-entities.service';
import { CreateBusinessEntityDto, UpdateBusinessEntityDto, EntityType } from './dto/create-business-entity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { CurrentOrg } from '../auth/decorators/org-roles.decorator';

@Controller('business-entities')
@UseGuards(JwtAuthGuard, TenantGuard)
export class BusinessEntitiesController {
  constructor(private readonly businessEntitiesService: BusinessEntitiesService) {}

  @Post()
  create(@Body() dto: CreateBusinessEntityDto, @CurrentOrg() orgId: string) {
    return this.businessEntitiesService.create(orgId, dto);
  }

  @Get()
  findAll(
    @CurrentOrg() orgId: string,
    @Query('type') entityType?: EntityType,
    @Query('search') search?: string,
  ) {
    return this.businessEntitiesService.findAll(orgId, entityType, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentOrg() orgId: string) {
    return this.businessEntitiesService.findOne(orgId, id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessEntityDto,
    @CurrentOrg() orgId: string,
  ) {
    return this.businessEntitiesService.update(orgId, id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentOrg() orgId: string) {
    return this.businessEntitiesService.remove(orgId, id);
  }
}
