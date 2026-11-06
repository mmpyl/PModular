'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export function OwnerShell({ children, active }: { children: ReactNode; active: string }) {
  const { logout, orgRole, memberships, organizationId } = useAuth();
  
  // Obtener membresía activa y módulos habilitados
  const activeMembership = memberships.find((m) => m.organizationId === organizationId) ?? null;
  const enabledModules = (() => {
    const configured = activeMembership?.organization?.enabledModules;
    const defaults = activeMembership?.organization?.businessType?.defaultModules;
    const modules = Array.isArray(configured) ? configured : defaults;
    return Array.isArray(modules) ? modules.filter((m): m is string => typeof m === 'string') : [];
  })();
  
  const canManage = orgRole === 'OWNER' || orgRole === 'ADMIN';
  const links = [
    { key: 'dashboard', label: 'Resumen', href: '/dashboard', visible: true },
    { key: 'products', label: 'Productos', href: '/products', module: 'inventario', visible: enabledModules.includes('inventario') },
    { key: 'categories', label: 'Categorías', href: '/categories', module: 'inventario', visible: enabledModules.includes('inventario') },
    { key: 'units', label: 'Unidades', href: '/units', module: 'inventario', visible: enabledModules.includes('inventario') },
    { key: 'inventory', label: 'Inventario', href: '/inventory', module: 'inventario', visible: enabledModules.includes('inventario') },
    { key: 'sales', label: 'Ventas', href: '/sales', module: 'ventas', visible: enabledModules.includes('ventas') },
    { key: 'purchases', label: 'Compras', href: '/purchase-orders', module: 'compras', visible: enabledModules.includes('compras') },
    { key: 'cash', label: 'Caja', href: '/cash-registers', module: 'caja', visible: enabledModules.includes('caja') },
    { key: 'team', label: 'Equipo', href: '/team', visible: canManage },
    { key: 'reports', label: 'Reportes', href: '/reports', visible: canManage },
    { key: 'settings', label: 'Configuración', href: '/business-settings', visible: canManage },
  ];
  const activeModule = links.find((link) => link.key === active)?.module;

  if (activeModule && !enabledModules.includes(activeModule)) {
    return (
      <ProtectedRoute>
        <div className="app-shell"><main className="workspace">
          <p className="error-message" role="alert">Este módulo está desactivado para el negocio.</p>
          <Link href="/dashboard">Volver al resumen</Link>
        </main></div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="app-shell">
        <aside className="sidebar">
          <div>
            <strong>PModular</strong>
            <span>{activeMembership?.organization?.name || 'Organización'}</span>
            <span className="role-badge">{orgRole === 'OWNER' ? 'Propietario' : orgRole}</span>
          </div>
          <nav aria-label="Navegación principal">
            {links.filter((link) => link.visible).map((link) => (
              <Link key={link.key} className={active === link.key ? 'active' : ''} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <button type="button" className="quiet-button" onClick={logout}>Cerrar sesión</button>
        </aside>
        <main className="workspace">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}

export function OwnerHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  const { memberships, organizationId, orgRole } = useAuth();
  const activeMembership = memberships.find((m) => m.organizationId === organizationId) ?? null;
  
  return (
    <header className="topbar">
      <div>
        <span className="eyebrow">{activeMembership?.organization?.businessType?.name || 'Negocio'} · {eyebrow}</span>
        <h1>{title}</h1>
      </div>
      <span className="role-badge">{orgRole === 'OWNER' ? 'Propietario' : orgRole}</span>
    </header>
  );
}
