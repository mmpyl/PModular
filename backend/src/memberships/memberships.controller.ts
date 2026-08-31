import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgRole } from '@prisma/client';

export interface CreateMembershipDto {
  userId: string;
  organizationId: string;
  role?: OrgRole;
}

@Controller('memberships')
@UseGuards(JwtAuthGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post()
  create(@Body() createMembershipDto: CreateMembershipDto) {
    return this.membershipsService.create(createMembershipDto);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.membershipsService.findByUser(userId);
  }

  @Get('organization/:organizationId')
  findByOrganization(@Param('organizationId') organizationId: string) {
    return this.membershipsService.findByOrganization(organizationId);
  }

  @Get(':userId/:organizationId')
  findOne(@Param('userId') userId: string, @Param('organizationId') organizationId: string) {
    return this.membershipsService.findOne(userId, organizationId);
  }

  @Delete(':userId/:organizationId')
  remove(@Param('userId') userId: string, @Param('organizationId') organizationId: string) {
    return this.membershipsService.remove(userId, organizationId);
  }
}
