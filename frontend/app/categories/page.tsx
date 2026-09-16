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
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, type Category } from '@/features/catalog/hooks';
import { categorySchema, type CategoryFormData } from '@/features/catalog/schemas';

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
      {createMutation.isError || updateMutation.isError || deleteMutation.isError ? (
        <p className="error-message" role="alert">
          {createMutation.error?.message || updateMutation.error?.message || deleteMutation.error?.message}
        </p>
      ) : null}
      {(createMutation.isSuccess || updateMutation.isSuccess) && (
        <p className="success-message">
          {editingId ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente'}
        </p>
      )}

      <RequireRole roles={WRITE_ROLES}>
        <section className="panel">
          <span className="eyebrow">{editingId ? 'Edición' : 'Alta'}</span>
          <h2>{editingId ? 'Editar categoría' : 'Nueva categoría'}</h2>
          <Form {...form}>
            <form className="compact-form" onSubmit={form.handleSubmit(onSubmit)}>
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
              {editingId && (
                <Button type="button" variant="link" className="quiet-link" onClick={resetForm}>
                  Cancelar edición
                </Button>
              )}
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? 'Guardar cambios' : 'Agregar categoría'}
              </Button>
            </form>
          </Form>
        </section>
      </RequireRole>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Estructura</span>
            <h2>Categorías activas</h2>
          </div>
          <span className="role-badge">{categories.length} categorías</span>
        </div>
        {isLoading ? (
          <p className="muted">Cargando...</p>
        ) : (
          <>
            {roots.map((category) => (
              <div key={category.id}>
                <div className="list-row">
                  <span>
                    <strong>{category.name}</strong>
                    <small>{category._count?.products ?? 0} productos</small>
                  </span>
                  <RequireRole roles={WRITE_ROLES}>
                    <div className="row-actions">
                      <Button type="button" variant="link" className="quiet-link" onClick={() => startEdit(category)}>
                        Editar
                      </Button>
                    </div>
                  </RequireRole>
                  <RequireRole roles={DELETE_ROLES}>
                    <div className="row-actions">
                      <Button
                        type="button"
                        variant="destructive"
                        className="danger"
                        onClick={() => void deleteCategory(category)}
                        disabled={deleteMutation.isPending}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </RequireRole>
                </div>
                {childrenOf(category.id).map((child) => (
                  <div className="list-row is-child" key={child.id}>
                    <span>
                      <strong>↳ {child.name}</strong>
                      <small>{child._count?.products ?? 0} productos</small>
                    </span>
                    <RequireRole roles={WRITE_ROLES}>
                      <div className="row-actions">
                        <Button type="button" variant="link" className="quiet-link" onClick={() => startEdit(child)}>
                          Editar
                        </Button>
                      </div>
                    </RequireRole>
                    <RequireRole roles={DELETE_ROLES}>
                      <div className="row-actions">
                        <Button
                          type="button"
                          variant="destructive"
                          className="danger"
                          onClick={() => void deleteCategory(child)}
                          disabled={deleteMutation.isPending}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </RequireRole>
                  </div>
                ))}
              </div>
            ))}
            {!roots.length && !createMutation.isError && (
              <p className="muted">No hay categorías para mostrar.</p>
            )}
          </>
        )}
      </section>
    </OwnerShell>
  );
}