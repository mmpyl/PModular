import { Injectable } from "@nestjs/common";

export type ModuleCatalogItem = {
  key: string;
  label: string;
  description: string;
};

/**
 * Authoritative list of modules that an organization can enable.
 *
 * Keeping this list in the backend prevents the settings screen, navigation,
 * and organization mutations from drifting apart as new modules are added.
 */
export const MODULE_CATALOG: readonly ModuleCatalogItem[] = [
  {
    key: "inventario",
    label: "Inventario",
    description: "Productos y existencias.",
  },
  {
    key: "ventas",
    label: "Ventas",
    description: "Registro e historial de ventas.",
  },
  {
    key: "compras",
    label: "Compras",
    description: "Órdenes de compra y recepción.",
  },
  {
    key: "caja",
    label: "Caja",
    description: "Apertura, cierre y movimientos de caja.",
  },
  {
    key: "almacenes",
    label: "Almacenes",
    description: "Almacenes, existencias y transferencias.",
  },
  {
    key: "lotes",
    label: "Lotes",
    description: "Trazabilidad y fechas de vencimiento.",
  },
  {
    key: "promociones",
    label: "Promociones",
    description: "Precios y descuentos automáticos.",
  },
  {
    key: "mermas",
    label: "Mermas",
    description: "Pérdidas, vencimientos y ajustes.",
  },
  {
    key: "comprobantes",
    label: "Comprobantes",
    description: "Comprobantes fiscales electrónicos.",
  },
  // Modules already present in organization data before the catalog existed.
  {
    key: "fraccionamiento",
    label: "Fraccionamiento",
    description: "Venta por unidades fraccionables.",
  },
  {
    key: "recetas",
    label: "Recetas",
    description: "Control de productos con receta.",
  },
] as const;

@Injectable()
export class ModuleCatalogService {
  findAll(): readonly ModuleCatalogItem[] {
    return MODULE_CATALOG;
  }

  isValidKeys(keys: string[]): boolean {
    const availableKeys = new Set(MODULE_CATALOG.map((module) => module.key));
    return keys.every((key) => availableKeys.has(key));
  }
}
