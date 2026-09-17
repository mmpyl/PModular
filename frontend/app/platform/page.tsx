'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PlatformRoute } from '@/components/PlatformRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PlatformPage() {
  const router = useRouter();
  const { isHydrated } = useAuth();

  useEffect(() => {
    if (isHydrated) {
      // Redirigir automáticamente a organizaciones por defecto
      router.push('/platform/organizations');
    }
  }, [isHydrated, router]);

  return (
    <PlatformRoute>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Panel de Plataforma</h1>
          <p className="text-muted-foreground">Administración global del sistema</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Organizaciones</CardTitle>
              <CardDescription>
                Gestiona todas las organizaciones registradas en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/platform/organizations')}>
                Ver organizaciones
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usuarios</CardTitle>
              <CardDescription>
                Administra los usuarios del sistema y sus roles de plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/platform/users')}>
                Ver usuarios
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PlatformRoute>
  );
}
