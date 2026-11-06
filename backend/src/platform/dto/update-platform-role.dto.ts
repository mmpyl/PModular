import { IsEnum, IsOptional } from 'class-validator';
import { PlatformRole } from '@prisma/client';

/**
 * DTO para actualizar el rol de plataforma de un usuario
 */
export class UpdatePlatformRoleDto {
  @IsEnum(PlatformRole, { message: 'El rol debe ser PLATFORM_ADMIN o SUPPORT' })
  @IsOptional()
  role?: PlatformRole | null;
}
