import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PlatformRole } from '@prisma/client';
import { PlatformRoles } from '../auth/decorators/org-roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { CreatePlatformUserDto, UpdatePlatformUserDto } from './dto/platform-user.dto';
import { UsersService } from './users.service';

@Controller('platform/users')
@UseGuards(JwtAuthGuard, PlatformRolesGuard)
@PlatformRoles(PlatformRole.PLATFORM_ADMIN)
export class PlatformUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.listBusinessUsers();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findBusinessUser(id);
  }

  @Post()
  create(@Body() dto: CreatePlatformUserDto) {
    return this.usersService.createBusinessUser(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlatformUserDto) {
    return this.usersService.updateBusinessUser(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.deleteBusinessUser(id);
  }
}