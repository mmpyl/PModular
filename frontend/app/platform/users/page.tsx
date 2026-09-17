'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { PlatformRoute } from '@/components/PlatformRoute';
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

interface PlatformUser {
  id: string;
  email: string;
  name: string | null;
  platformRole: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    memberships: number;
  };
}

interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function PlatformUsersPage() {
  const router = useRouter();
  const { token, isHydrated } = useAuth();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '10',
        ...(searchTerm && { search: searchTerm }),
      });
      
      const result = await apiFetch<PaginatedResult<PlatformUser>>(
        `/platform/users?${params}`,
        { token }
      );
      
      setUsers(result.data);
      setTotalPages(result.meta.totalPages);
      setTotal(result.meta.total);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHydrated && token) {
      fetchUsers();
    }
  }, [isHydrated, token, page, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'PLATFORM_ADMIN':
        return 'bg-red-100 text-red-800';
      case 'SUPPORT':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <PlatformRoute>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Panel de Plataforma</h1>
            <p className="text-muted-foreground">Gestión de usuarios del sistema</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/platform/organizations')}>
            Ver Organizaciones
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Usuarios</CardTitle>
            <CardDescription>
              Listado de todos los usuarios registrados en la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <Input
                type="text"
                placeholder="Buscar por email o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Button type="submit" variant="secondary">
                Buscar
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setSearchTerm(''); setPage(1); }}
              >
                Limpiar
              </Button>
            </form>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Cargando usuarios...</p>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
                {error}
              </div>
            )}

            {!loading && !error && users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron usuarios
              </div>
            )}

            {!loading && !error && users.length > 0 && (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Rol de Plataforma</TableHead>
                      <TableHead>Membresías</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead>Última Actualización</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.name ?? '-'}</TableCell>
                        <TableCell>
                          {user.platformRole && (
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(user.platformRole)}`}
                            >
                              {user.platformRole}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{user._count?.memberships ?? 0}</TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(user.updatedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {users.length} de {total} usuarios
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Anterior
                    </Button>
                    <span className="flex items-center px-4 text-sm">
                      Página {page} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PlatformRoute>
  );
}
