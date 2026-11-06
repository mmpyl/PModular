import { Injectable, Logger } from '@nestjs/common';
import { PseProvider, PseProviderType } from '../interfaces/pse-provider.interface';
import { NubefactProvider } from './providers/nubefact.provider';
import { SunatDirectoProvider } from './providers/sunat.provider';
import { SolucionFactibleProvider } from './providers/solucion-factible.provider';

/**
 * Factory para crear instancias de proveedores PSE/OSE
 * Permite cambiar de proveedor dinámicamente según configuración de la organización
 */
@Injectable()
export class PseProviderFactory {
  private readonly logger = new Logger(PseProviderFactory.name);

  constructor(
    private readonly nubefactProvider: NubefactProvider,
    private readonly sunatProvider: SunatDirectoProvider,
    private readonly solucionFactibleProvider: SolucionFactibleProvider,
  ) {}

  /**
   * Obtiene el proveedor configurado para una organización
   */
  getProvider(providerType: PseProviderType): PseProvider {
    this.logger.log(`Obteniendo proveedor PSE: ${providerType}`);

    switch (providerType) {
      case PseProviderType.NUBEFACT:
        return this.nubefactProvider;
      
      case PseProviderType.SUNAT_DIRECTO:
        return this.sunatProvider;
      
      case PseProviderType.SOLUCION_FACTIBLE:
        return this.solucionFactibleProvider;
      
      default:
        this.logger.warn(`Proveedor no reconocido: ${providerType}, usando Nubefact por defecto`);
        return this.nubefactProvider;
    }
  }

  /**
   * Valida si un proveedor está disponible y configurado correctamente
   */
  async validateProvider(providerType: PseProviderType): Promise<boolean> {
    const provider = this.getProvider(providerType);
    return await provider.validateCredentials();
  }

  /**
   * Lista todos los proveedores disponibles
   */
  getAvailableProviders(): PseProviderType[] {
    return Object.values(PseProviderType);
  }
}
