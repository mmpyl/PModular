import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PseProvider, PseProviderResponse, PseProviderStatus, InvoiceData } from '../interfaces/pse-provider.interface';
import { NubefactProvider } from './nubefact.provider';
import { SunatProvider } from './sunat.provider';
import { SolucionFactibleProvider } from './solucion-factible.provider';

/**
 * Enum con los tipos de proveedores soportados
 */
export enum ProviderType {
  NUBEFACT = 'nubefact',
  SUNAT = 'sunat',
  SOLUCION_FACTIBLE = 'solucion_factible',
}

/**
 * Información comparativa de proveedores
 */
export interface ProviderInfo {
  name: string;
  type: ProviderType;
  costPerDocument: string;
  apiType: 'REST' | 'SOAP';
  avgResponseTime: string;
  supportsInvoice: boolean;
  supportsReceipt: boolean;
  supportsCreditNote: boolean;
  supportsDebitNote: boolean;
  requiresDigitalCertificate: boolean;
  documentationUrl: string;
  pros: string[];
  cons: string[];
}

/**
 * Servicio factory para gestionar múltiples proveedores PSE/OSE
 * Permite cambiar dinámicamente entre proveedores según configuración
 */
@Injectable()
export class PseProviderFactory {
  private readonly logger = new Logger(PseProviderFactory.name);
  private providers: Map<ProviderType, PseProvider> = new Map();
  private defaultProviderType: ProviderType;

  constructor(
    private configService: ConfigService,
    private nubefactProvider: NubefactProvider,
    private sunatProvider: SunatProvider,
    private solucionFactibleProvider: SolucionFactibleProvider,
  ) {
    // Registrar todos los proveedores disponibles
    this.providers.set(ProviderType.NUBEFACT, nubefactProvider);
    this.providers.set(ProviderType.SUNAT, sunatProvider);
    this.providers.set(ProviderType.SOLUCION_FACTIBLE, solucionFactibleProvider);

    // Configurar proveedor por defecto desde variables de entorno
    const defaultProvider = this.configService.get<string>('PSE_DEFAULT_PROVIDER') || 'nubefact';
    this.defaultProviderType = this.stringToProviderType(defaultProvider);
  }

  /**
   * Obtiene el proveedor configurado por defecto
   */
  getDefaultProvider(): PseProvider {
    return this.providers.get(this.defaultProviderType)!;
  }

  /**
   * Obtiene un proveedor específico por tipo
   */
  getProvider(type: ProviderType): PseProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Proveedor ${type} no está disponible`);
    }
    return provider;
  }

  /**
   * Obtiene el proveedor configurado para una organización específica
   * Lee la configuración fiscal de la organización para determinar qué proveedor usar
   */
  async getProviderForOrganization(organizationId: string): Promise<PseProvider> {
    // TODO: Consultar OrganizationFiscalSettings para obtener el proveedor configurado
    // Por ahora retorna el proveedor por defecto
    this.logger.debug(`Obteniendo proveedor para organización ${organizationId}`);
    return this.getDefaultProvider();
  }

  /**
   * Lista todos los proveedores disponibles con su información comparativa
   */
  listAvailableProviders(): ProviderInfo[] {
    return [
      {
        name: 'Nubefact',
        type: ProviderType.NUBEFACT,
        costPerDocument: '$0.03 - $0.05 USD',
        apiType: 'REST',
        avgResponseTime: '1-3 segundos',
        supportsInvoice: true,
        supportsReceipt: true,
        supportsCreditNote: true,
        supportsDebitNote: true,
        requiresDigitalCertificate: false,
        documentationUrl: 'https://app.nubefact.com/docs/api/',
        pros: [
          'API REST moderna y fácil de integrar',
          'Excelente documentación',
          'Soporte técnico responsivo',
          'No requiere certificado digital propio',
          'Tiempo de respuesta rápido',
        ],
        cons: [
          'Costo por comprobante',
          'Dependencia de servicio externo',
        ],
      },
      {
        name: 'SUNAT Directo',
        type: ProviderType.SUNAT,
        costPerDocument: 'GRATIS',
        apiType: 'SOAP',
        avgResponseTime: '3-8 segundos',
        supportsInvoice: true,
        supportsReceipt: true,
        supportsCreditNote: true,
        supportsDebitNote: true,
        requiresDigitalCertificate: true,
        documentationUrl: 'https://www.sunat.gob.pe/orientacion/electronica/servicios.html',
        pros: [
          'Sin costo por comprobante',
          'Conexión directa a SUNAT',
          'Control total del proceso',
          'No hay intermediarios',
        ],
        cons: [
          'Requiere certificado digital (costo anual)',
          'API SOAP más compleja',
          'Mayor tiempo de implementación',
          'Mantenimiento de certificados',
          'Tiempos de respuesta más lentos',
        ],
      },
      {
        name: 'Solucion Factible',
        type: ProviderType.SOLUCION_FACTIBLE,
        costPerDocument: '$0.02 - $0.04 USD',
        apiType: 'REST',
        avgResponseTime: '2-4 segundos',
        supportsInvoice: true,
        supportsReceipt: true,
        supportsCreditNote: true,
        supportsDebitNote: true,
        requiresDigitalCertificate: false,
        documentationUrl: 'https://solucionfactible.com/sfe/documentacion/',
        pros: [
          'Costo competitivo',
          'API REST simple',
          'Soporta guías de remisión',
          'Buena documentación',
        ],
        cons: [
          'Costo por comprobante',
          'Menos popular que Nubefact',
        ],
      },
    ];
  }

  /**
   * Valida las credenciales de todos los proveedores configurados
   */
  async validateAllProviders(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [type, provider] of this.providers.entries()) {
      results[type] = await provider.validateCredentials();
      this.logger.log(`Validación ${type}: ${results[type] ? 'EXITOSA' : 'FALLIDA'}`);
    }
    
    return results;
  }

  /**
   * Cambia el proveedor por defecto
   */
  setDefaultProvider(type: ProviderType): void {
    if (!this.providers.has(type)) {
      throw new Error(`Proveedor ${type} no está disponible`);
    }
    this.defaultProviderType = type;
    this.logger.log(`Proveedor por defecto cambiado a ${type}`);
  }

  /**
   * Obtiene el tipo de proveedor por defecto
   */
  getDefaultProviderType(): ProviderType {
    return this.defaultProviderType;
  }

  /**
   * Convierte string a ProviderType
   */
  private stringToProviderType(value: string): ProviderType {
    switch (value.toLowerCase()) {
      case 'nubefact':
        return ProviderType.NUBEFACT;
      case 'sunat':
        return ProviderType.SUNAT;
      case 'solucion_factible':
      case 'solucion factible':
        return ProviderType.SOLUCION_FACTIBLE;
      default:
        return ProviderType.NUBEFACT;
    }
  }
}
