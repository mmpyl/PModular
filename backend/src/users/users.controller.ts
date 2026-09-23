import { Controller, Param, Patch, UseGuards, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { PlatformRoles } from '../auth/decorators/org-roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * DTO para asignar rol de plataforma
 */
class AssignPlatformRoleDto {
  role!: 'PLATFORM_ADMIN' | 'SUPPORT' | null;
}

/**
 * Módulo de usuarios para administración global.
 * Endpoints protegidos con JwtAuthGuard + PlatformRolesGuard.
 */
@Controller('platform/users')
@UseGuards(JwtAuthGuard, PlatformRolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * PATCH /platform/users/:id/role
   * Asigna o revoca un rol de plataforma (PLATFORM_ADMIN/SUPPORT) a un usuario.
   * Solo accesible para PLATFORM_ADMIN (no SUPPORT, para evitar auto-promoción).
   * Valida que no se pueda remover el rol al último PLATFORM_ADMIN.
   */
  @Patch(':id/role')
  @PlatformRoles('PLATFORM_ADMIN')
  async assignPlatformRole(
    @Param('id') userId: string,
    @Body() body: AssignPlatformRoleDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.assignPlatformRole(
      userId,
      body.role === null ? null : (body.role as any),
      currentUser.id,
    );
  }
}
