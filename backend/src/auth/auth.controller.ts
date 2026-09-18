import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { OrgRoles } from './decorators/org-roles.decorator';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OrgRolesGuard } from './guards/org-roles.guard';
import { PlatformRolesGuard } from './guards/platform-roles.guard';
import { PlatformRoles } from './decorators/org-roles.decorator';
import { AuthService } from './auth.service';
import { MembershipsService } from '../memberships/memberships.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Request } from 'express';

export class SelectOrganizationDto {
  organizationId!: string;
}

export class PlatformLoginDto {
  email!: string;
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly membershipsService: MembershipsService,
  ) {}

  @Post('register')
  register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Endpoint específico para login de usuarios de plataforma (Owen).
   * Valida que el usuario tenga rol de plataforma (PLATFORM_ADMIN o SUPPORT).
   */
  @Post('platform/login')
  @PlatformRoles('PLATFORM_ADMIN', 'SUPPORT')
  @UseGuards(JwtAuthGuard, PlatformRolesGuard)
  platformLogin(@Req() req: Request) {
    const user = req.user as { sub: string };
    return this.authService.platformLogin(user.sub);
  }

  @Post('select-organization')
  @UseGuards(JwtAuthGuard)
  selectOrganization(@Body() dto: SelectOrganizationDto, @Req() req: Request) {
    const user = req.user as { sub: string };
    return this.authService.selectOrganization(user.sub, dto.organizationId);
  }

  @Get('memberships')
  @UseGuards(JwtAuthGuard)
  async getMemberships(@Req() req: Request) {
    const user = req.user as { sub: string };
    const memberships = await this.membershipsService.findByUser(user.sub);
    return memberships;
  }

  @Get('admin-check')
  @UseGuards(JwtAuthGuard, OrgRolesGuard)
  @OrgRoles('ADMIN', 'OWNER')
  adminCheck() {
    return { ok: true };
  }
}
