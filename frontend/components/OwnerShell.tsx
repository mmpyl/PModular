'use client';

import Link from 'next/link';
import { ReactNode, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Menu, LogOut, User, Building2 } from 'lucide-react';

export function OwnerShell({ children, active }: { children: ReactNode; active: string }) {
  const { logout, orgRole, memberships, organizationId } = useAuth();
  
  // Obtener membresía activa y módulos habilitados
  const activeMembership = memberships.find((m) => m.organizationId === organizationId) ?? null;
  const enabledModules = (() => {
    const configured = activeMembership?.organization?.enabledModules;
    const defaults = activeMembership?.organization?.businessType?.defaultModules;
    const modules = Array.isArray(configured) && configured.length ? configured : defaults;
    return Array.isArray(modules) ? modules.filter((m): m is string => typeof m === 'string') : [];
  })();
  
  const canManage = orgRole === 'OWNER' || orgRole === 'ADMIN';
  const isCaja = orgRole === 'CAJA';
  const links = [
    { key: 'dashboard', label: 'Resumen', href: '/dashboard', visible: true },
    { key: 'products', label: 'Productos', href: '/products', visible: enabledModules.includes('inventario') },
    { key: 'categories', label: 'Categorías', href: '/categories', visible: enabledModules.includes('inventario') },
    { key: 'units', label: 'Unidades', href: '/units', visible: enabledModules.includes('inventario') },
    { key: 'inventory', label: 'Inventario', href: '/inventory', visible: enabledModules.includes('inventario') },
    { key: 'sales', label: 'Ventas', href: '/sales', visible: enabledModules.includes('ventas') },
    { key: 'purchases', label: 'Compras', href: '/purchase-orders', visible: enabledModules.includes('compras') },
    { key: 'cash', label: 'Caja', href: '/cash-registers', visible: enabledModules.includes('caja') || isCaja },
    { key: 'team', label: 'Equipo', href: '/team', visible: canManage },
    { key: 'reports', label: 'Reportes', href: '/reports', visible: canManage },
    { key: 'settings', label: 'Configuración', href: '/business-settings', visible: orgRole === 'OWNER' },
  ];

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card text-foreground border-r border-border">
      <div className="p-4 border-b border-border">
        <strong className="text-lg font-semibold block">PModular</strong>
        <span className="text-sm text-muted-foreground block mt-1">
          {activeMembership?.organization?.name || 'Organización'}
        </span>
        <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded">
          {orgRole === 'OWNER' ? 'Propietario' : orgRole}
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Navegación principal">
        {links.filter((link) => link.visible).map((link) => (
          <Link
            key={link.key}
            className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              active === link.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            href={link.href}
            onClick={() => setSidebarOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card">
          <SidebarContent />
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card text-foreground border-b border-border px-4 py-3 flex items-center justify-between">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-card border-border">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <span className="font-semibold">PModular</span>
          <div className="w-10" /> {/* Spacer for balance */}
        </div>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 pt-14 md:pt-0">
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
    <header className="bg-card border-b border-border px-4 py-4 md:px-6 md:py-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <span className="text-sm text-muted-foreground block">
            {activeMembership?.organization?.businessType?.name || 'Negocio'} · {eyebrow}
          </span>
          <h1 className="text-2xl font-bold text-foreground mt-1">{title}</h1>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-transparent text-primary self-start sm:self-auto">
          <Building2 className="mr-1 h-3 w-3" />
          {orgRole === 'OWNER' ? 'Propietario' : orgRole}
        </span>
      </div>
    </header>
  );
}
