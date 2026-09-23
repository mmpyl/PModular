'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type PlatformOrganization = {
  id: string;
  name: string;
  businessTypeId: string;
  businessType: {
    id: string;
    name: string;
    code: string;
    defaultModules: unknown;
  };
  enabledModules: unknown;
  settings: unknown;
  createdAt: string;
  updatedAt: string;
  status?: 'ACTIVE' | 'SUSPENDED';
  members?: Array<{
    id: string;
    userId: string;
    role: 'OWNER' | 'ADMIN' | 'VENDEDOR' | 'INVENTARIO' | 'CAJA';
    user: {
      id: string;
      email: string;
      name: string | null;
    };
  }>;
};

export default function PlatformOrganizationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const orgId = params.id as string;

  const { data, isLoading, error } = useQuery<PlatformOrganization>({
    queryKey: ['platform', 'organization', orgId],
    queryFn: async () => {
      return apiFetch<PlatformOrganization>(`/platform/organizations/${orgId}`, {
        token: token ?? undefined,
      });
    },
    enabled: !!orgId,
  });

  const suspendMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/platform/organizations/${orgId}/suspend`, {
        method: 'PATCH',
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'organization', orgId] });
      queryClient.invalidateQueries({ queryKey: ['platform', 'organizations'] });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/platform/organizations/${orgId}/reactivate`, {
        method: 'PATCH',
        token: token ?? undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'organization', orgId] });
      queryClient.invalidateQueries({ queryKey: ['platform', 'organizations'] });
    },
  });

  const handleSuspend = async () => {
    if (!confirm('¿Estás seguro de suspender esta organización? Esta acción impedirá el acceso de todos sus miembros.')) {
      return;
    }
    setActionLoading('suspend');
    try {
      await suspendMutation.mutateAsync();
    } catch (e) {
      console.error('Error al suspender:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async () => {
    if (!confirm('¿Estás seguro de reactivar esta organización?')) {
      return;
    }
    setActionLoading('reactivate');
    try {
      await reactivateMutation.mutateAsync();
    } catch (e) {
      console.error('Error al reactivar:', e);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p>Cargando organización...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <p className="text-destructive mb-4">Error al cargar la organización</p>
          <Button onClick={() => router.push('/platform/organizations')}>
            Volver al listado
          </Button>
        </div>
      </main>
    );
  }

  const isActive = data.status === 'ACTIVE' || !data.status;
  const enabledModules = Array.isArray(data.enabledModules) ? data.enabledModules : [];

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-6xl space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{data.name}</h1>
            <p className="text-muted-foreground">
              Detalle de organización
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/platform/organizations')}
            >
              ← Volver al listado
            </Button>
            {isActive ? (
              <Button
                variant="destructive"
                onClick={handleSuspend}
                disabled={actionLoading !== null || suspendMutation.isPending}
              >
                {actionLoading === 'suspend' ? 'Suspendiendo...' : 'Suspender'}
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={handleReactivate}
                disabled={actionLoading !== null || reactivateMutation.isPending}
              >
                {actionLoading === 'reactivate' ? 'Reactivando...' : 'Reactivar'}
              </Button>
            )}
          </div>
        </header>

        {/* Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Estado</CardTitle>
            <CardDescription>Situación actual de la organización</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={isActive ? 'default' : 'destructive'}>
              {isActive ? 'Activa' : 'Suspendida'}
            </Badge>
          </CardContent>
        </Card>

        {/* Datos generales */}
        <Card>
          <CardHeader>
            <CardTitle>Datos Generales</CardTitle>
            <CardDescription>Información básica de la organización</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ID</p>
                <p className="font-mono text-sm">{data.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Negocio</p>
                <p>{data.businessType?.name ?? data.businessTypeId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Código de Tipo</p>
                <p>{data.businessType?.code ?? '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Creado</p>
                <p>{new Date(data.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Actualizado</p>
                <p>{new Date(data.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Módulos habilitados */}
        <Card>
          <CardHeader>
            <CardTitle>Módulos Habilitados</CardTitle>
            <CardDescription>Módulos activos para esta organización</CardDescription>
          </CardHeader>
          <CardContent>
            {enabledModules.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {enabledModules.map((module: string) => (
                  <Badge key={module} variant="secondary">
                    {module}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No hay módulos habilitados específicamente.</p>
            )}
          </CardContent>
        </Card>

        {/* Miembros */}
        <Card>
          <CardHeader>
            <CardTitle>Miembros</CardTitle>
            <CardDescription>
              {data.members?.length ?? 0} miembro{data.members?.length !== 1 ? 's' : ''} en la organización
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.members && data.members.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>ID Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.user.name ?? member.user.email}</TableCell>
                      <TableCell>{member.user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.role}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {member.userId}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">No hay miembros en esta organización.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
