'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlatformOrganizations, usePlatformUsers } from '@/features/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PlatformPage() {
  const { user, platformRole, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'organizations' | 'users'>('organizations');
  const [searchOrg, setSearchOrg] = useState('');
  const [searchUser, setSearchUser] = useState('');

  const { data: orgsData, isLoading: loadingOrgs } = usePlatformOrganizations({
    page: 1,
    pageSize: 10,
    search: searchOrg || undefined,
  });

  const { data: usersData, isLoading: loadingUsers } = usePlatformUsers({
    page: 1,
    pageSize: 10,
    search: searchUser || undefined,
  });

  if (!platformRole || (platformRole !== 'PLATFORM_ADMIN' && platformRole !== 'SUPPORT')) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acceso denegado</CardTitle>
            <CardDescription>
              No tienes permisos para acceder al panel de plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={logout} variant="outline">
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-muted/40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/platform" className="font-bold text-lg">
              Owen · Panel de Plataforma
            </Link>
            <Badge variant={platformRole === 'PLATFORM_ADMIN' ? 'default' : 'secondary'}>
              {platformRole === 'PLATFORM_ADMIN' ? 'Administrador' : 'Soporte'}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button onClick={logout} variant="ghost" size="sm">
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'organizations' ? 'default' : 'outline'}
            onClick={() => setActiveTab('organizations')}
          >
            Organizaciones
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
          >
            Usuarios
          </Button>
        </div>

        {/* Organizations Tab */}
        {activeTab === 'organizations' && (
          <Card>
            <CardHeader>
              <CardTitle>Organizaciones</CardTitle>
              <CardDescription>
                Gestiona todas las organizaciones registradas en la plataforma.
              </CardDescription>
              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Buscar por nombre..."
                  value={searchOrg}
                  onChange={(e) => setSearchOrg(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loadingOrgs ? (
                <p className="text-muted-foreground">Cargando...</p>
              ) : orgsData?.data && orgsData.data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo de negocio</TableHead>
                      <TableHead>Módulos</TableHead>
                      <TableHead>Miembros</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Creado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgsData.data.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell>{org.businessType.name}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {org.enabledModules?.slice(0, 3).map((m) => (
                              <Badge key={m} variant="outline" className="text-xs">
                                {m}
                              </Badge>
                            ))}
                            {org.enabledModules && org.enabledModules.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{org.enabledModules.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{org._count?.memberships ?? 0}</TableCell>
                        <TableCell>
                          <Badge variant={org.enabledModules && org.enabledModules.length > 0 ? 'default' : 'secondary'}>
                            {org.enabledModules && org.enabledModules.length > 0 ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(org.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No se encontraron organizaciones.</p>
              )}

              {/* Pagination info */}
              {orgsData?.meta && (
                <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                  <span>
                    Página {orgsData.meta.page} de {orgsData.meta.totalPages}
                  </span>
                  <span>Total: {orgsData.meta.total} organizaciones</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>Usuarios</CardTitle>
              <CardDescription>
                Visualiza todos los usuarios registrados en la plataforma.
              </CardDescription>
              <div className="flex gap-2 mt-4">
                <Input
                  placeholder="Buscar por email..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <p className="text-muted-foreground">Cargando...</p>
              ) : usersData?.data && usersData.data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Rol Plataforma</TableHead>
                      <TableHead>Membresías</TableHead>
                      <TableHead>Creado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData.data.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.email}</TableCell>
                        <TableCell>{u.name ?? '-'}</TableCell>
                        <TableCell>
                          {u.platformRole ? (
                            <Badge variant={u.platformRole === 'PLATFORM_ADMIN' ? 'default' : 'secondary'}>
                              {u.platformRole === 'PLATFORM_ADMIN' ? 'Admin' : 'Soporte'}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Sin rol</span>
                          )}
                        </TableCell>
                        <TableCell>{u._count?.memberships ?? 0}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No se encontraron usuarios.</p>
              )}

              {/* Pagination info */}
              {usersData?.meta && (
                <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                  <span>
                    Página {usersData.meta.page} de {usersData.meta.totalPages}
                  </span>
                  <span>Total: {usersData.meta.total} usuarios</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
