'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { RequireRole } from '@/components/RequireRole';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, type Category } from '@/features/catalog/hooks';
import { categorySchema, type CategoryFormData } from '@/features/catalog/schemas';
import { CheckCircle2, XCircle } from 'lucide-react';

// Crear/editar: OWNER/ADMIN/INVENTARIO. Eliminar: solo OWNER/ADMIN (backend).
const WRITE_ROLES = ['OWNER', 'ADMIN', 'INVENTARIO'];
const DELETE_ROLES = ['OWNER', 'ADMIN'];

export default function CategoriesPage() {
  const { token, organizationId, orgRole } = useAuth();
  const orgId = organizationId ?? undefined;
  const { data: categories = [], isLoading } = useCategories(orgId);
  const createMutation = useCreateCategory(orgId);
  const updateMutation = useUpdateCategory(orgId);
  const deleteMutation = useDeleteCategory(orgId);

  const form = useForm<CategoryFormData & { id?: string }>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', parentId: null },
  });

  const editingId = form.getValues('id');

  const canWrite = orgRole !== null && WRITE_ROLES.includes(orgRole);
  const canDelete = orgRole !== null && DELETE_ROLES.includes(orgRole);

  function resetForm() {
    form.reset({ name: '', parentId: null });
  }

  function startEdit(category: Category) {
    form.reset({ id: category.id, name: category.name, parentId: category.parentId ?? null });
  }

  async function onSubmit(data: CategoryFormData & { id?: string }) {
    if (!token || !organizationId) return;
    const { id, ...submitData } = data as CategoryFormData & { id?: string };
    try {
      if (id) {
        await updateMutation.mutateAsync({ id, data: submitData as CategoryFormData });
      } else {
        await createMutation.mutateAsync(submitData as CategoryFormData);
      }
      resetForm();
    } catch {
      // Error manejado por el hook
    }
  }

  async function deleteCategory(categoryV: Category) {
    if (!token || !organizationId) return;
    if (!window.confirm(`¿Eliminar la categoría "${categoryV.name}"?`)) return;
    await deleteMutation.mutateAsync(categoryV.id);
  }

  const roots = categories.filter((c) => !c.parentId);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);

  return (
    <OwnerShell active="categories">
      <OwnerHeader eyebrow="Catálogo" title="Categorías" />
      
      {/* Mensajes de error */}
      {(createMutation.isError || updateMutation.isError || deleteMutation.isError) && (
        <Alert variant="destructive" className="mb-4" role="alert">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {createMutation.error?.message || updateMutation.error?.message || deleteMutation.error?.message}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Mensajes de éxito */}
      {(createMutation.isSuccess || updateMutation.isSuccess) && (
        <Alert variant="default" className="mb-4 bg-green-50 border-green-200 text-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            {editingId ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente'}
          </AlertDescription>
        </Alert>
      )}

      <RequireRole roles={WRITE_ROLES}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{editingId ? 'Editar categoría' : 'Nueva categoría'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría padre</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sin padre (nivel superior)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Sin padre (nivel superior)</SelectItem>
                          {categories
                            .filter((c) => c.id !== editingId)
                            .map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center gap-2">
                  {editingId && (
                    <Button type="button" variant="ghost" onClick={resetForm}>
                      Cancelar edición
                    </Button>
                  )}
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingId ? 'Guardar cambios' : 'Agregar categoría'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </RequireRole>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">Estructura</div>
              <CardTitle>Categorías activas</CardTitle>
            </div>
            <Badge variant="secondary">{categories.length} categorías</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-gray-500">Cargando...</p>
          ) : (
            <>
              {roots.map((category) => (
                <div key={category.id}>
                  <div className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-gray-500">{category._count?.products ?? 0} productos</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RequireRole roles={WRITE_ROLES}>
                        <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(category)}>
                          Editar
                        </Button>
                      </RequireRole>
                      <RequireRole roles={DELETE_ROLES}>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => void deleteCategory(category)}
                          disabled={deleteMutation.isPending}
                        >
                          Eliminar
                        </Button>
                      </RequireRole>
                    </div>
                  </div>
                  {childrenOf(category.id).map((child) => (
                    <div 
                      className="flex items-center justify-between py-3 border-b last:border-0 pl-6 bg-gray-50" 
                      key={child.id}
                    >
                      <div>
                        <div className="font-medium flex items-center gap-1">
                          <span className="text-gray-400">↳</span> {child.name}
                        </div>
                        <div className="text-sm text-gray-500">{child._count?.products ?? 0} productos</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <RequireRole roles={WRITE_ROLES}>
                          <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(child)}>
                            Editar
                          </Button>
                        </RequireRole>
                        <RequireRole roles={DELETE_ROLES}>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => void deleteCategory(child)}
                            disabled={deleteMutation.isPending}
                          >
                            Eliminar
                          </Button>
                        </RequireRole>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {!roots.length && !createMutation.isError && (
                <p className="text-sm text-gray-500">No hay categorías para mostrar.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </OwnerShell>
  );
}