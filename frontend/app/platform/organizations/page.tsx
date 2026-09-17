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

interface PlatformOrganization {
  id: string;
  name: string;
  businessTypeId: string;
  businessType: {
    id: string;
    name: string;
    code: string;
  };
  enabledModules: string[];
  createdAt: string;
  updatedAt: string;
  members?: Array<{
    id: string;
    userId: string;
    role: string;
    user: {
      id: string;
      email: string;
      name: string | null;
    };
  }>;
  _count?: {
    memberships: number;
    products?: number;
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

export default function PlatformOrganizationsPage() {
  const router = useRouter();
  const { token, isHydrated } = useAuth();
  const [organizations, setOrganizations] = useState<PlatformOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrganizations = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '10',
        ...(searchTerm && { search: searchTerm }),
      });
      
      const result = await apiFetch<PaginatedResult<PlatformOrganization>>(
        `/platform/organizations?${params}`,
        { token }
      );
      
      setOrganizations(result.data);
      setTotalPages(result.meta.totalPages);
      setTotal(result.meta.total);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar organizaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHydrated && token) {
      fetchOrganizations();
    }
  }, [isHydrated, token, page, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrganizations();
  };

  const handleViewDetails = (orgId: string) => {
    // Futura implementación: ver detalles de organización
    console.log('Ver detalles de organización:', orgId);
  };

  return (
    <PlatformRoute>
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Panel de Plataforma</h1>
            <p className="text-muted-foreground">Gestión de organizaciones del sistema</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/platform/users')}>
            Ver Usuarios
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Organizaciones</CardTitle>
            <CardDescription>
              Listado de todas las organizaciones registradas en la plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <Input
                type="text"
                placeholder="Buscar por nombre..."
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
                <p className="text-muted-foreground">Cargando organizaciones...</p>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
                {error}
              </div>
            )}

            {!loading && !error && organizations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron organizaciones
              </div>
            )}

            {!loading && !error && organizations.length > 0 && (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo de Negocio</TableHead>
                      <TableHead>Módulos</TableHead>
                      <TableHead>Miembros</TableHead>
                      <TableHead>Productos</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell>{org.businessType?.name || org.businessTypeId}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {org.enabledModules?.slice(0, 3).map((module) => (
                              <span
                                key={module}
                                className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded"
                              >
                                {module}
                              </span>
                            ))}
                            {org.enabledModules && org.enabledModules.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{org.enabledModules.length - 3} más
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{org._count?.memberships ?? org.members?.length ?? 0}</TableCell>
                        <TableCell>{org._count?.products ?? '-'}</TableCell>
                        <TableCell>
                          {new Date(org.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(org.id)}
                          >
                            Ver detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {organizations.length} de {total} organizaciones
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
