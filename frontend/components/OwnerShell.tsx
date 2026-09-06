'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const labels: Record<string, string> = { inventario: 'Inventario', ventas: 'Ventas', compras: 'Compras', caja: 'Caja' };

export function OwnerShell({ children, active }: { children: ReactNode; active: string }) {
  const { logout, orgRole, activeMembership, enabledModules } = useAuth();
  const canManage = orgRole === 'OWNER' || orgRole === 'ADMIN';
  const ownerRestricted = orgRole === 'OWNER' && ['products', 'categories', 'inventory', 'sales'].includes(active);
  const links = [
    { key: 'dashboard', label: 'Resumen', href: '/dashboard', visible: true },
    { key: 'products', label: 'Productos', href: '/products', visible: orgRole !== 'OWNER' && enabledModules.includes('inventario') },
    { key: 'categories', label: 'Categorías', href: '/categories', visible: orgRole !== 'OWNER' && enabledModules.includes('inventario') },
    { key: 'inventory', label: 'Inventario', href: '/inventory', visible: orgRole !== 'OWNER' && enabledModules.includes('inventario') },
    { key: 'sales', label: 'Ventas', href: '/sales', visible: orgRole !== 'OWNER' && enabledModules.includes('ventas') },
    { key: 'purchases', label: 'Compras', href: '/purchase-orders', visible: enabledModules.includes('compras') },
    { key: 'cash', label: 'Caja', href: '/cash-registers', visible: enabledModules.includes('caja') },
    { key: 'team', label: 'Equipo', href: '/team', visible: canManage },
    { key: 'reports', label: 'Reportes', href: '/reports', visible: orgRole === 'OWNER' || orgRole === 'ADMIN' },
    { key: 'settings', label: 'Configuración', href: '/business-settings', visible: orgRole === 'OWNER' },
  ];

  return <ProtectedRoute><div className="app-shell"><aside className="sidebar"><div><strong>PModular</strong><span>{activeMembership?.organization.name || 'Organización'}</span></div><nav>{links.filter((link) => link.visible).map((link) => <Link key={link.key} className={active === link.key ? 'active' : ''} href={link.href}>{link.label}</Link>)}</nav><button type="button" className="quiet-button" onClick={logout}>Cerrar sesión</button></aside><main className="workspace">{ownerRestricted ? <section className="panel restricted-panel"><span className="eyebrow">Acceso restringido</span><h1>Este módulo lo administra el equipo operativo</h1><p>Como propietario, puedes revisar reportes, permisos y configuración del negocio.</p><Link className="primary-link" href="/reports">Ir a reportes</Link></section> : children}</main></div></ProtectedRoute>;
}

export function OwnerHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  const { activeMembership, orgRole } = useAuth();
  return <header className="topbar"><div><span className="eyebrow">{activeMembership?.organization.businessType?.name || 'Negocio'} · {eyebrow}</span><h1>{title}</h1></div><span className="role-badge">{orgRole === 'OWNER' ? 'Propietario' : orgRole}</span></header>;
}