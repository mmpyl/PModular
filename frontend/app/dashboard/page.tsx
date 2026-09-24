'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiError, Membership } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Menu, LogOut, LayoutDashboard, Package, Tags, ClipboardList, ShoppingCart, Building2, Users, FileBarChart, Settings, Box } from 'lucide-react';

type DashboardMetrics = {
  sales: { today: number; thisMonth: number };
  revenue: { today: number; thisMonth: number };
  inventory: { totalValue: number; lowStockAlerts: number };
  customers: { total: number; activeThisMonth: number };
  topProducts: { productName: string; totalQuantity: number; totalRevenue: number }[];
};

type InventorySummary = { totalProducts: number; totalValue: number; lowStockItems: number; expiringSoonItems: number };
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' });

export default function DashboardPage() {
  const { token, organizationId, orgRole, user, logout, memberships } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [inventory, setInventory] = useState<InventorySummary | null>(null);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Obtener membresía activa y módulos habilitados
  const activeMembership = memberships.find((m) => m.organizationId === organizationId) ?? null;
  const enabledModules = (() => {
    const configured = activeMembership?.organization?.enabledModules;
    const defaults = activeMembership?.organization?.businessType?.defaultModules;
    const modules = Array.isArray(configured) && configured.length ? configured : defaults;
    return Array.isArray(modules) ? modules.filter((m): m is string => typeof m === 'string') : [];
  })();

  useEffect(() => {
    if (!token || !organizationId) return;
    const load = async () => {
      try {
        setError('');
        if (orgRole === 'INVENTARIO') {
          setInventory(await apiFetch<InventorySummary>('/reports/inventory/summary', { token, organizationId }));
        } else {
          setMetrics(await apiFetch<DashboardMetrics>('/reports/dashboard/metrics', { token, organizationId }));
        }
      } catch (caughtError) {
        setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudieron cargar las métricas');
      }
    };
    void load();
  }, [organizationId, orgRole, token]);

  const navigationItems = [
    { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard, active: true },
    ...(orgRole !== 'OWNER' && enabledModules.includes('inventario') ? [
      { href: '/products', label: 'Productos', icon: Package },
      { href: '/categories', label: 'Categorías', icon: Tags },
      { href: '/inventory', label: 'Inventario', icon: ClipboardList },
    ] : []),
    ...(orgRole !== 'OWNER' && enabledModules.includes('ventas') ? [
      { href: '/sales', label: 'Ventas', icon: ShoppingCart },
    ] : []),
    ...(orgRole !== 'OWNER' && enabledModules.includes('caja') ? [
      { href: '/cash-registers', label: 'Caja', icon: Building2 },
    ] : []),
    ...((orgRole === 'OWNER' || orgRole === 'ADMIN') ? [
      { href: '/team', label: 'Equipo', icon: Users },
      { href: '/reports', label: 'Reportes', icon: FileBarChart },
    ] : []),
    ...(orgRole === 'OWNER' ? [
      { href: '/business-settings', label: 'Configuración', icon: Settings },
    ] : []),
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-muted/50 border-r">
      <div className="p-4 border-b">
        <div className="font-semibold text-lg">PModular</div>
        <div className="text-sm text-muted-foreground">Gestión empresarial</div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              item.active
                ? 'bg-muted text-foreground'
                : 'text-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-card">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-muted/50">
          <SidebarContent />
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menú">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="font-semibold">PModular</div>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.imageUrl ?? undefined} alt={user?.name ?? user?.email ?? ''} />
            <AvatarFallback>{user?.name?.charAt(0) ?? user?.email?.charAt(0) ?? 'U'}</AvatarFallback>
          </Avatar>
        </div>

        {/* Main Content */}
        <main className="md:ml-64 min-h-screen">
          <header className="border-b bg-card px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  {activeMembership?.organization?.businessType?.name || 'Negocio'} · Panel de control
                </div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Buenos días, {user?.name || user?.email}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeMembership?.organization?.name}
                </p>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <Badge variant={orgRole === 'OWNER' ? 'default' : 'secondary'}>
                  {orgRole === 'OWNER' ? 'Propietario' : orgRole}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.imageUrl ?? undefined} alt={user?.name ?? user?.email ?? ''} />
                        <AvatarFallback>{user?.name?.charAt(0) ?? user?.email?.charAt(0) ?? 'U'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md" role="alert">
                {error}
              </div>
            )}
            
            {!metrics && !inventory && !error && (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Cargando actividad...</div>
              </div>
            )}

            {metrics && (
              <>
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Ventas de hoy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{metrics.sales.today}</div>
                      <div className="text-sm text-muted-foreground">{money.format(metrics.revenue.today)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Ventas del mes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{metrics.sales.thisMonth}</div>
                      <div className="text-sm text-muted-foreground">{money.format(metrics.revenue.thisMonth)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Valor del inventario</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{money.format(metrics.inventory.totalValue)}</div>
                      <div className="text-sm text-muted-foreground">{metrics.inventory.lowStockAlerts} alertas de stock</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Clientes activos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{metrics.customers.activeThisMonth}</div>
                      <div className="text-sm text-muted-foreground">{metrics.customers.total} registrados</div>
                    </CardContent>
                  </Card>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Rendimiento</div>
                          <CardTitle>Productos más vendidos</CardTitle>
                        </div>
                        {orgRole !== 'OWNER' && (
                          <Link href="/products">
                            <Button variant="outline" size="sm">Ver catálogo</Button>
                          </Link>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {metrics.topProducts.length ? (
                        <div className="space-y-3">
                          {metrics.topProducts.map((product) => (
                            <div key={product.productName} className="flex items-center justify-between py-2 border-b last:border-0">
                              <span className="text-sm font-medium">{product.productName}</span>
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">{product.totalQuantity} uds.</span>
                                <span className="mx-2">·</span>
                                <span>{money.format(product.totalRevenue)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Todavía no hay ventas registradas.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50">
                    <CardHeader>
                      <div className="text-sm text-muted-foreground mb-1">Administración</div>
                      <CardTitle>Control del negocio</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Consulta resultados, permisos y configuración de tu organización.
                      </p>
                      <Link href="/reports">
                        <Button className="w-full">Abrir reportes</Button>
                      </Link>
                    </CardContent>
                  </Card>
                </section>
              </>
            )}

            {inventory && (
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Productos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{inventory.totalProducts}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Valor total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{money.format(inventory.totalValue)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Stock bajo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{inventory.lowStockItems}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Próximos a vencer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{inventory.expiringSoonItems}</div>
                  </CardContent>
                </Card>
              </section>
            )}

            <Card>
              <CardHeader>
                <div className="text-sm text-muted-foreground mb-1">Configuración del negocio</div>
                <CardTitle>Módulos activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {enabledModules.map((module) => (
                    <Badge key={module} variant="outline" className="flex items-center gap-1">
                      <Box className="h-3 w-3" />
                      {module}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {orgRole === 'OWNER'
                    ? 'El propietario administra permisos y módulos según el tipo de negocio.'
                    : 'El administrador opera los módulos habilitados para este negocio.'}
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
