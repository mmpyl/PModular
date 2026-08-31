import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { OrgRoles } from './decorators/org-roles.decorator';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OrgRolesGuard } from './guards/org-roles.guard';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('admin-check')
  @UseGuards(JwtAuthGuard, OrgRolesGuard)
  @OrgRoles('ADMIN', 'OWNER')
  adminCheck() {
    return { ok: true };
  }
}
