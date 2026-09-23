import { Module } from '@nestjs/common';
import { PseProviderFactory } from './pse-provider.factory';
import { NubefactProvider } from './providers/nubefact.provider';
import { SunatDirectoProvider } from './providers/sunat.provider';
import { SolucionFactibleProvider } from './providers/solucion-factible.provider';

/**
 * Módulo PSE Provider
 * Provee la infraestructura para enviar comprobantes electrónicos a SUNAT
 * a través de diferentes proveedores (PSE/OSE)
 */
@Module({
  providers: [
    PseProviderFactory,
    NubefactProvider,
    SunatDirectoProvider,
    SolucionFactibleProvider,
  ],
  exports: [
    PseProviderFactory,
    NubefactProvider,
    SunatDirectoProvider,
    SolucionFactibleProvider,
  ],
})
export class PseProviderModule {}
