'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type AuditLogEntry = {
  id: string;
  userId: string | null;
  userPlatformRole: string | null;
  action: string;
  entityType: string;
  entityId: string;
  organizationId: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
  organization?: {
    id: string;
    name: string;
  };
};

type PaginatedAuditLogResult = {
  data: AuditLogEntry[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

const ACTION_LABELS: Record<string, string> = {
  ORGANIZATION_SUSPENDED: 'Organización suspendida',
  ORGANIZATION_REACTIVATED: 'Organización reactivada',
  MEMBER_ADDED: 'Miembro agregado',
  MEMBER_REMOVED: 'Miembro eliminado',
  MEMBER_ROLE_CHANGED: 'Rol cambiado',
  USER_CREATED: 'Usuario creado',
  USER_UPDATED: 'Usuario actualizado',
  USER_DELETED: 'Usuario eliminado',
  PRODUCT_CREATED: 'Producto creado',
  PRODUCT_UPDATED: 'Producto actualizado',
  PRODUCT_DELETED: 'Producto eliminado',
  INVENTORY_ADJUSTED: 'Inventario ajustado',
  PURCHASE_ORDER_CREATED: 'Orden de compra creada',
  PURCHASE_ORDER_UPDATED: 'Orden de compra actualizada',
  PURCHASE_ORDER_COMPLETED: 'Orden de compra completada',
  SALE_CREATED: 'Venta realizada',
  SALE_CANCELLED: 'Venta cancelada',
  SALE_RETURNED: 'Devolución realizada',
  BATCH_CREATED: 'Lote creado',
  BATCH_RETAINED: 'Lote retenido',
  BATCH_EXPIRED: 'Lote expirado',
  CASH_REGISTER_OPENED: 'Caja abierta',
  CASH_REGISTER_CLOSED: 'Caja cerrada',
  CASH_REGISTER_ADJUSTMENT: 'Ajuste de caja',
  OTHER: 'Otro',
};

const ENTITY_TYPE_COLORS: Record<string, string> = {
  Organization: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  User: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Membership: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  Product: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Sale: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  PurchaseOrder: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  Batch: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  CashRegister: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  InventoryItem: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
};

export default function PlatformAuditLogPage() {
  const router = useRouter();
  const { token } = useAuth();
  
  const [filters, setFilters] = useState({
    organizationId: '',
    action: '',
    entityType: '',
    startDate: '',
    endDate: '',
    page: 1,
    pageSize: 20,
  });

  const { data, isLoading, error, refetch } = useQuery<PaginatedAuditLogResult>({
    queryKey: ['platform', 'audit-log', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.organizationId) params.append('organizationId', filters.organizationId);
      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('page', filters.page.toString());
      params.append('pageSize', filters.pageSize.toString());

      return apiFetch<PaginatedAuditLogResult>(`/platform/audit-log?${params.toString()}`, {
        token: token ?? undefined,
      });
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({
      organizationId: '',
      action: '',
      entityType: '',
      startDate: '',
      endDate: '',
      page: 1,
      pageSize: 20,
    });
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p>Cargando logs de auditoría...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p className="text-destructive">Error al cargar los logs de auditoría</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-8">
      <div className="w-full max-w-7xl space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Audit Log</h1>
            <p className="text-muted-foreground">
              Historial de acciones sensibles en la plataforma
            </p>
          </div>
          <button
            onClick={() => router.push('/platform/dashboard')}
            className="text-primary hover:underline"
          >
            ← Volver al dashboard
          </button>
        </header>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Filtra los logs por organización, tipo de acción, entidad o rango de fechas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Organización</label>
                <Input
                  placeholder="ID de organización"
                  value={filters.organizationId}
                  onChange={(e) => handleFilterChange('organizationId', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de acción</label>
                <Select
                  value={filters.action}
                  onValueChange={(value) => handleFilterChange('action', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las acciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las acciones</SelectItem>
                    {Object.entries(ACTION_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de entidad</label>
                <Select
                  value={filters.entityType}
                  onValueChange={(value) => handleFilterChange('entityType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las entidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las entidades</SelectItem>
                    <SelectItem value="Organization">Organización</SelectItem>
                    <SelectItem value="User">Usuario</SelectItem>
                    <SelectItem value="Membership">Membresía</SelectItem>
                    <SelectItem value="Product">Producto</SelectItem>
                    <SelectItem value="Sale">Venta</SelectItem>
                    <SelectItem value="PurchaseOrder">Orden de compra</SelectItem>
                    <SelectItem value="Batch">Lote</SelectItem>
                    <SelectItem value="CashRegister">Caja</SelectItem>
                    <SelectItem value="InventoryItem">Inventario</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha inicio</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha fin</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
              <Button onClick={() => refetch()}>
                Aplicar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de logs */}
        <Card>
          <CardHeader>
            <CardTitle>Logs de Auditoría</CardTitle>
            <CardDescription>
              Mostrando {data?.data.length ?? 0} de {data?.meta.total ?? 0} registros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol Plataforma</TableHead>
                  <TableHead>Organización</TableHead>
                  <TableHead>Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {new Date(log.createdAt).toLocaleString('es-ES', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={ENTITY_TYPE_COLORS[log.entityType] ?? 'bg-gray-100 text-gray-800'}>
                        {log.entityType}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground font-mono">
                        {log.entityId.slice(0, 8)}...
                      </p>
                    </TableCell>
                    <TableCell>
                      {log.user ? (
                        <div>
                          <p className="font-medium">{log.user.name ?? log.user.email}</p>
                          <p className="text-xs text-muted-foreground">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sistema</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.userPlatformRole ? (
                        <Badge variant="outline">{log.userPlatformRole}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.organization ? (
                        <p className="font-medium">{log.organization.name}</p>
                      ) : log.organizationId ? (
                        <p className="text-xs text-muted-foreground font-mono">
                          {log.organizationId.slice(0, 8)}...
                        </p>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {Object.keys(log.metadata).length > 0 ? (
                        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-20">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {data?.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No hay logs de auditoría que coincidan con los filtros seleccionados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Paginación */}
        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {data.meta.page} de {data.meta.totalPages} • {data.meta.total} registros totales
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={data.meta.page <= 1}
                onClick={() => handlePageChange(data.meta.page - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                disabled={data.meta.page >= data.meta.totalPages}
                onClick={() => handlePageChange(data.meta.page + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
