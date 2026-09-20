import { IsOptional, IsString, IsEnum, IsObject } from 'class-validator';
import { AuditActionType } from '@prisma/client';

export class CreateAuditLogDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  userPlatformRole?: string;

  @IsEnum(AuditActionType)
  action: AuditActionType;

  @IsString()
  entityType: string;

  @IsString()
  entityId: string;

  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
