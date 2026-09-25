/**
 * Fase 3 - tarea 3.1: única fuente de verdad de la navegación del shell.
 *
 * Cada ítem declara su módulo (el moduleKey que viene en el JWT/membership en
 * `organization.enabledModules` o `businessType.defaultModules`) y los roles
 * de organización que lo ven. El shell (components/AppShell) filtra con
 * `visibleNavItems()`; los tests unitarios de Fase 4 verifican esta matriz.
 */

export type OrgRole = 'OWNER' | 'ADMIN' | 'VENDEDOR' | 'INVENTARIO' | 'CAJA';
export type ModuleKey = 'inventario' | 'ventas' | 'compras' | 'caja';

export type NavItem = {
  key: string;
  label: string;
  href: string;
  /** Módulo requerido (undefined = siempre visible para cualquier rol autenticado). */
  module?: ModuleKey;
  /** Roles permitidos (undefined = todos los roles de organización). */
  roles?: OrgRole[];
};

const MANAGE: OrgRole[] = ['OWNER', 'ADMIN'];

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Resumen', href: '/dashboard' },
  { key: 'products', label: 'Productos', href: '/products', module: 'inventario' },
  { key: 'categories', label: 'Categorías', href: '/categories', module: 'inventario' },
  { key: 'units', label: 'Unidades', href: '/units', module: 'inventario' },
  { key: 'inventory', label: 'Inventario', href: '/inventory', module: 'inventario' },
  { key: 'sales', label: 'Ventas', href: '/sales', module: 'ventas' },
  { key: 'purchases', label: 'Compras', href: '/purchase-orders', module: 'compras' },
  // Caja: visible para el módulo caja o para quien tenga rol CAJA (aunque su org no liste el módulo explícitamente)
  { key: 'cash', label: 'Caja', href: '/cash-registers', module: 'caja' },
  { key: 'team', label: 'Equipo', href: '/team', roles: MANAGE },
  { key: 'reports', label: 'Reportes', href: '/reports', roles: MANAGE },
  { key: 'settings', label: 'Configuración', href: '/business-settings', roles: ['OWNER'] },
];

export function visibleNavItems(role: string | null, enabledModules: string[]): NavItem[] {
  if (!role) return [];
  const isCaja = role === 'CAJA';
  return NAV_ITEMS.filter((item) => {
    if (item.roles && !item.roles.includes(role as OrgRole)) return false;
    if (item.module && !enabledModules.includes(item.module) && !(item.key === 'cash' && isCaja)) {
      return false;
    }
    return true;
  });
}
