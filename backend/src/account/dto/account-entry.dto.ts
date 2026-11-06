import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';

export enum AccountEntryType {
  CREDITO = 'CREDITO', // Aumenta la deuda del cliente (fiado)
  DEBITO = 'DEBITO', // Reduce la deuda (abono)
}

/**
 * Registro manual de un asiento en la cuenta corriente del cliente.
 * Útil para ajustes, saldos iniciales ("debe antiguo") o abonos sin pago asociado.
 */
export class CreateAccountEntryDto {
  @IsString()
  customerId!: string;

  @IsEnum(AccountEntryType)
  type!: AccountEntryType;

  @IsNumber()
  @Min(0.01, { message: 'El monto del asiento debe ser mayor que cero' })
  amount!: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateAccountEntryNotesDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
