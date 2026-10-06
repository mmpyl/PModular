import { ElectronicDocumentType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class SaveNubefactSettingsDto {
  @IsUrl({ protocols: ['https'], require_protocol: true })
  endpointUrl!: string;

  @IsOptional()
  @IsString()
  @MinLength(16)
  token?: string;
}

export class IssueElectronicDocumentDto {
  @IsEnum(ElectronicDocumentType)
  type!: ElectronicDocumentType;
}