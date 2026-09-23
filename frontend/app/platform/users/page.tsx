'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

type PlatformUser = {
  id: string;
  email: string;
  name?: string | null;
  platformRole?: 'PLATFORM_ADMIN' | 'SUPPORT' | null;
  createdAt: string;
  updatedAt: string;
};

type PaginatedResult<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export default function PlatformUsersPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<PaginatedResult<PlatformUser>>({
    queryKey: ['platform', 'users'],
    queryFn: async () => {
      return apiFetch<PaginatedResult<PlatformUser>>('/platform/users', {
        token: token ?? undefined,
      });
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'PLATFORM_ADMIN' | 'SUPPORT' | null }) => {
      return apiFetch(`/platform/users/${userId}/role`, {
        method: 'PATCH',
        token: token ?? undefined,
        body: JSON.stringify({ role }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'users'] });
      setSelectedRole(null);
    },
  });

  const isPlatformAdmin = user?.platformRole === 'PLATFORM_ADMIN';

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p>Cargando usuarios...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p className="text-destructive">Error al cargar usuarios</p>
      </main>
    );
  }

  const handleRoleChange = (userId: string, newRole: string) => {
    const role = newRole === 'none' ? null : (newRole as 'PLATFORM_ADMIN' | 'SUPPORT');
    assignRoleMutation.mutate({ userId, role });
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-6xl space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Usuarios</h1>
            <p className="text-muted-foreground">
              Listado de todos los usuarios en la plataforma
            </p>
          </div>
          <button
            onClick={() => router.push('/platform/dashboard')}
            className="text-primary hover:underline"
          >
            ← Volver al dashboard
          </button>
        </header>

        {assignRoleMutation.isError && (
          <div className="rounded-md bg-destructive/15 p-4 text-destructive">
            <p>Error al cambiar el rol: {assignRoleMutation.error.message}</p>
          </div>
        )}

        <div className="grid gap-4">
          {data?.data.map((userItem) => (
            <Card key={userItem.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{userItem.name ?? userItem.email}</CardTitle>
                  {isPlatformAdmin && (
                    <Select
                      value={selectedRole === userItem.id ? (userItem.platformRole ?? 'none') : (userItem.platformRole ?? 'none')}
                      onValueChange={(value) => {
                        setSelectedRole(userItem.id);
                        handleRoleChange(userItem.id, value);
                      }}
                      disabled={assignRoleMutation.isPending}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PLATFORM_ADMIN">Administrador</SelectItem>
                        <SelectItem value="SUPPORT">Soporte</SelectItem>
                        <SelectItem value="none">Sin rol</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <CardDescription>
                  {userItem.email} •{' '}
                  Rol: {userItem.platformRole ?? 'Sin rol'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>ID: {userItem.id}</p>
                  <p>Creado: {new Date(userItem.createdAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {data?.data.length === 0 && (
            <p className="text-muted-foreground">No hay usuarios registrados.</p>
          )}
        </div>

        {data && data.meta.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <p className="text-sm text-muted-foreground">
              Página {data.meta.page} de {data.meta.totalPages}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
