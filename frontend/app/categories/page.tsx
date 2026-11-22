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
  const { token, organizationId } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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
      let successMessage: string;
      if (editingId) {
        await apiFetch(`/categories/${editingId}`, { method: 'PATCH', token, organizationId, body });
        successMessage = 'Categoría actualizada correctamente';
      } else {
        await apiFetch('/categories', { method: 'POST', token, organizationId, body });
        successMessage = 'Categoría creada correctamente';
      }
      setError(''); resetForm(); setMessage(successMessage); await loadCategories();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo guardar la categoría');
    }
  }

  async function deleteCategory(categoryV: Category) {
    if (!token || !organizationId) return;
    if (!window.confirm(`¿Eliminar la categoría "${categoryV.name}"?`)) return;
    await deleteMutation.mutateAsync(categoryV.id);
  }

  const roots = categories.filter((c) => !c.parentId);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);
  const filteredCategories = categories.filter((category) =>
    category.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()) ||
    category.parent?.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );

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

      <div className="catalog-layout">
      <RequireRole roles={WRITE_ROLES}>
        <section className="panel catalog-editor">
          <span className="eyebrow">{editingId ? 'Edición' : 'Alta'}</span>
          <h2>{editingId ? 'Editar categoría' : 'Nueva categoría'}</h2>
          <form className="compact-form" onSubmit={saveCategory}>
            <label>Nombre<input required value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label>
              Categoría padre
              <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
                <option value="">Sin padre (nivel superior)</option>
                {categories.filter((c) => c.id !== editingId).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            {editingId && <button type="button" className="quiet-link" onClick={resetForm}>Cancelar edición</button>}
            <button type="submit">{editingId ? 'Guardar cambios' : 'Agregar categoría'}</button>
          </form>
        </section>
      </RequireRole>

      <section className="panel">
        <div className="panel-heading">
          <div><span className="eyebrow">Estructura</span><h2>Categorías activas</h2></div>
          <span className="role-badge">{categories.length} categorías</span>
        </div>
        <div className="catalog-search-row">
          <input aria-label="Buscar categorías" placeholder="Buscar categoría..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        {search ? filteredCategories.map((category) => (
          <div className="list-row" key={category.id}>
            <span><strong>{category.name}</strong><small>{category.parent ? `Subcategoría de ${category.parent.name}` : 'Nivel superior'} · {category._count?.products ?? 0} productos</small></span>
            <RequireRole roles={WRITE_ROLES}><button type="button" className="quiet-link" onClick={() => startEdit(category)}>Editar</button></RequireRole>
            <RequireRole roles={DELETE_ROLES}><button type="button" className="danger" onClick={() => void deleteCategory(category)}>Eliminar</button></RequireRole>
          </div>
        )) : roots.map((category) => (
          <div key={category.id}>
            <div className="list-row">
              <span><strong>{category.name}</strong><small>{category._count?.products ?? 0} productos</small></span>
              <RequireRole roles={WRITE_ROLES}>
                <div className="row-actions">
                  <button type="button" className="quiet-link" onClick={() => startEdit(category)}>Editar</button>
                </div>
              </RequireRole>
              <RequireRole roles={DELETE_ROLES}>
                <div className="row-actions">
                  <button type="button" className="danger" onClick={() => void deleteCategory(category)}>Eliminar</button>
                </div>
              </RequireRole>
            </div>
            <Badge variant="secondary">{categories.length} categorías</Badge>
          </div>
        ))}
        {search && !filteredCategories.length && <p className="muted">No hay categorías que coincidan con la búsqueda.</p>}
        {!search && !roots.length && !error && <p className="muted">No hay categorías para mostrar.</p>}
      </section>
      </div>
    </OwnerShell>
  );
}