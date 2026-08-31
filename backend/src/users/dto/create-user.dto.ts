import { Role } from '@prisma/client';
import { IsArray, IsEmail, IsEnum, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @IsOptional()
  @IsObject()
  datosAdicionales?: Record<string, unknown>;
}
