'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

type PlatformUser = {
  id: string;
  email: string;
  name?: string | null;
  platformRole?: string | null;
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
  const { token } = useAuth();

  const { data, isLoading, error } = useQuery<PaginatedResult<PlatformUser>>({
    queryKey: ['platform', 'users'],
    queryFn: async () => {
      return apiFetch<PaginatedResult<PlatformUser>>('/platform/users', {
        token: token ?? undefined,
      });
    },
  });

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

        <div className="grid gap-4">
          {data?.data.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <CardTitle>{user.name ?? user.email}</CardTitle>
                <CardDescription>
                  {user.email} • 
                  Rol: {user.platformRole ?? 'Sin rol'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>ID: {user.id}</p>
                  <p>Creado: {new Date(user.createdAt).toLocaleDateString()}</p>
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
