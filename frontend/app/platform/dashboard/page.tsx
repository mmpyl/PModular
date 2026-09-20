'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlatformDashboardPage() {
  const { platformRole, isAuthenticated, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;
    
    // Verificar que el usuario tenga rol de plataforma
    if (!isAuthenticated || !platformRole || !['PLATFORM_ADMIN', 'SUPPORT'].includes(platformRole)) {
      router.push('/platform/login');
    }
  }, [isHydrated, isAuthenticated, platformRole, router]);

  if (!isHydrated || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p>Cargando...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-6xl space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Panel de Plataforma</h1>
            <p className="text-muted-foreground">
              Administración global del sistema - Rol: {platformRole}
            </p>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Organizaciones</CardTitle>
              <CardDescription>Gestionar todas las organizaciones del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <button 
                onClick={() => router.push('/platform/organizations')}
                className="text-primary hover:underline"
              >
                Ver organizaciones →
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usuarios</CardTitle>
              <CardDescription>Gestionar usuarios de la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <button 
                onClick={() => router.push('/platform/users')}
                className="text-primary hover:underline"
              >
                Ver usuarios →
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>Historial de acciones sensibles en la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <button 
                onClick={() => router.push('/platform/audit-log')}
                className="text-primary hover:underline"
              >
                Ver audit log →
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
