import { IsOptional, IsString, IsEnum, IsObject } from 'class-validator';
import { AuditActionType, PlatformRole } from '@prisma/client';

export class CreateAuditLogDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(PlatformRole)
  userPlatformRole?: PlatformRole;

  @IsEnum(AuditActionType)
  action!: AuditActionType;

  @IsString()
  entityType!: string;

  @IsString()
  entityId!: string;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
