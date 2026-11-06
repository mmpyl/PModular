import { IsString, IsOptional, IsBoolean, IsNumber, IsObject, Min, Max } from 'class-validator';

export class CreateOrganizationFiscalSettingsDto {
  @IsString()
  ruc!: string;

  @IsString()
  razonSocial!: string;

  @IsString()
  @IsOptional()
  nombreComercial?: string;

  @IsString()
  direccion!: string;

  @IsString()
  ubige!: string;

  @IsString()
  departamento!: string;

  @IsString()
  provincia!: string;

  @IsString()
  distrito!: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsObject()
  @IsOptional()
  seriesAutorizadas?: Record<string, string[]>;

  @IsString()
  @IsOptional()
  serieActualFactura?: string;

  @IsString()
  @IsOptional()
  serieActualBoleta?: string;

  @IsString()
  @IsOptional()
  serieActualNotaCredito?: string;

  @IsString()
  @IsOptional()
  serieActualNotaDebito?: string;

  @IsObject()
  @IsOptional()
  ultimosCorrelativos?: Record<string, number>;

  @IsString()
  @IsOptional()
  pseProvider?: string;

  @IsString()
  @IsOptional()
  pseUsername?: string;

  @IsString()
  @IsOptional()
  psePassword?: string;

  @IsString()
  @IsOptional()
  pseEnvironment?: string;

  @IsString()
  @IsOptional()
  certificadoDigital?: string;

  @IsString()
  @IsOptional()
  certificadoPassword?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  igvRate?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  icbperRate?: number;

  @IsString()
  @IsOptional()
  moneda?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  notasInternas?: string;
}

export class UpdateOrganizationFiscalSettingsDto {
  @IsString()
  @IsOptional()
  ruc?: string;

  @IsString()
  @IsOptional()
  razonSocial?: string;

  @IsString()
  @IsOptional()
  nombreComercial?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  ubige?: string;

  @IsString()
  @IsOptional()
  departamento?: string;

  @IsString()
  @IsOptional()
  provincia?: string;

  @IsString()
  @IsOptional()
  distrito?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsObject()
  @IsOptional()
  seriesAutorizadas?: Record<string, string[]>;

  @IsString()
  @IsOptional()
  serieActualFactura?: string;

  @IsString()
  @IsOptional()
  serieActualBoleta?: string;

  @IsString()
  @IsOptional()
  serieActualNotaCredito?: string;

  @IsString()
  @IsOptional()
  serieActualNotaDebito?: string;

  @IsObject()
  @IsOptional()
  ultimosCorrelativos?: Record<string, number>;

  @IsString()
  @IsOptional()
  pseProvider?: string;

  @IsString()
  @IsOptional()
  pseUsername?: string;

  @IsString()
  @IsOptional()
  psePassword?: string;

  @IsString()
  @IsOptional()
  pseEnvironment?: string;

  @IsString()
  @IsOptional()
  certificadoDigital?: string;

  @IsString()
  @IsOptional()
  certificadoPassword?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  igvRate?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  icbperRate?: number;

  @IsString()
  @IsOptional()
  moneda?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isConfigured?: boolean;

  @IsString()
  @IsOptional()
  notasInternas?: string;
}
