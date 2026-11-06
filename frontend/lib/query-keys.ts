/**
 * Fase 3 - tarea 3.2: registro central de query keys para react-query.
 * Cada dominio define sus keys aquí para que invalidaciones y tests compartan
 * la misma convención (evita strings sueltos en los hooks).
 */
export const queryKeys = {
  organizations: {
    all: ["organizations"] as const,
    mine: () => [...queryKeys.organizations.all, "mine"] as const,
    detail: (id: string | null | undefined) =>
      [...queryKeys.organizations.all, id] as const,
  },
  memberships: {
    all: ["memberships"] as const,
    byOrg: (organizationId?: string | null) =>
      [...queryKeys.memberships.all, organizationId] as const,
  },
  products: {
    all: ["products"] as const,
    list: (organizationId?: string | null) =>
      [...queryKeys.products.all, organizationId] as const,
  },
  categories: { all: ["categories"] as const },
  units: { all: ["units"] as const },
  inventory: { all: ["inventory"] as const },
  sales: {
    all: ["sales"] as const,
    list: (organizationId?: string | null, status?: string) =>
      [...queryKeys.sales.all, organizationId, status] as const,
  },
  "purchase-orders": {
    all: ["purchase-orders"] as const,
  },
  "cash-registers": {
    all: ["cash-registers"] as const,
    movements: (registerId?: string | null) =>
      [...queryKeys["cash-registers"].all, "movements", registerId] as const,
  },
  "business-entities": { all: ["business-entities"] as const },
  accounts: { all: ["accounts"] as const },
  modules: {
    all: ["module-catalog"] as const,
    catalog: () => [...queryKeys.modules.all] as const,
  },
} as const;
