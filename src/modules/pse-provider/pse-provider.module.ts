import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NubefactProvider } from './providers/nubefact.provider';
import { SunatProvider } from './providers/sunat.provider';
import { SolucionFactibleProvider } from './providers/solucion-factible.provider';
import { PseProviderFactory } from './pse-provider.factory';

/**
 * Módulo de proveedores PSE/OSE
 * Proporciona integración con múltiples proveedores de facturación electrónica
 */
@Module({
  imports: [
    ConfigModule,
  ],
  providers: [
    NubefactProvider,
    SunatProvider,
    SolucionFactibleProvider,
    PseProviderFactory,
  ],
  exports: [
    NubefactProvider,
    SunatProvider,
    SolucionFactibleProvider,
    PseProviderFactory,
  ],
})
export class PseProviderModule {}
