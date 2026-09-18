'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

type PlatformOrganization = {
  id: string;
  name: string;
  businessTypeId: string;
  createdAt: string;
  updatedAt: string;
  businessType?: {
    id: string;
    code: string;
    name: string;
  };
  _count?: {
    memberships: number;
  };
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

export default function PlatformOrganizationsPage() {
  const router = useRouter();
  const { token } = useAuth();

  const { data, isLoading, error } = useQuery<PaginatedResult<PlatformOrganization>>({
    queryKey: ['platform', 'organizations'],
    queryFn: async () => {
      return apiFetch<PaginatedResult<PlatformOrganization>>('/platform/organizations', {
        token: token ?? undefined,
      });
    },
  });

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p>Cargando organizaciones...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p className="text-destructive">Error al cargar organizaciones</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-6xl space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Organizaciones</h1>
            <p className="text-muted-foreground">
              Listado de todas las organizaciones en la plataforma
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
          {data?.data.map((org) => (
            <Card key={org.id}>
              <CardHeader>
                <CardTitle>{org.name}</CardTitle>
                <CardDescription>
                  Tipo: {org.businessType?.name ?? org.businessTypeId} • 
                  Miembros: {org._count?.memberships ?? 0}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>ID: {org.id}</p>
                  <p>Creado: {new Date(org.createdAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {data?.data.length === 0 && (
            <p className="text-muted-foreground">No hay organizaciones registradas.</p>
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
