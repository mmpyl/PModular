'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { RequireRole } from '@/components/RequireRole';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useProducts, useCategories, useUnits, useCreateProduct, useUpdateProduct, useDeleteProduct, type Product as ProductType } from '@/features/catalog/hooks';
import { productSchema, type ProductFormData } from '@/features/catalog/schemas';

type SchemaField = { type?: string; default?: unknown; options?: unknown[]; label?: string };

// Crear/editar catálogo: OWNER/ADMIN/INVENTARIO (espejo del OrgRolesGuard del backend)
const WRITE_ROLES = ['OWNER', 'ADMIN', 'INVENTARIO'];
// Eliminar productos: OWNER/ADMIN según el backend
const DELETE_ROLES = ['OWNER', 'ADMIN'];

export default function ProductsPage() {
  const { token, organizationId, orgRole, memberships } = useAuth();
  const { data: products = [], isLoading: loadingProducts } = useProducts(organizationId ?? undefined);
  const { data: categories = [] } = useCategories(organizationId ?? undefined);
  const { data: units = [] } = useUnits(organizationId ?? undefined);
  const createMutation = useCreateProduct(organizationId ?? undefined);
  const updateMutation = useUpdateProduct(organizationId ?? undefined);
  const deleteMutation = useDeleteProduct(organizationId ?? undefined);

  // productSchema del BusinessType de la membresía activa
  const activeMembership = memberships.find((m) => m.organizationId === organizationId) ?? null;
  const productSchemaDef = (activeMembership?.organization?.businessType?.productSchema ?? {}) as Record<string, SchemaField>;
  const schemaFields = Object.entries(productSchemaDef);

  const form = useForm<ProductFormData & { id?: string }>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      price: 0,
      cost: undefined,
      categoryId: null,
      unitId: null,
      attributes: {},
    },
  });

  const editingId = form.watch('id') as string | undefined;
  const search = form.getValues('search' as any) as string | undefined;
  const filterCategory = form.getValues('filterCategory' as any) as string | undefined;

  const canWrite = orgRole !== null && WRITE_ROLES.includes(orgRole);
  const canDelete = orgRole !== null && DELETE_ROLES.includes(orgRole);

  function resetForm() {
    form.reset({
      id: undefined,
      name: '',
      sku: '',
      price: 0,
      cost: undefined,
      categoryId: null,
      unitId: null,
      attributes: {},
    });
  }

  function startEdit(product: ProductType) {
    form.reset({
      id: product.id,
      name: product.name,
      sku: product.sku ?? '',
      price: Number(product.price) || 0,
      cost: product.cost != null ? Number(product.cost) : undefined,
      categoryId: product.category?.id ?? null,
      unitId: product.unit?.id ?? null,
      attributes: (product.attributes ?? {}) as Record<string, unknown>,
    });
  }

  async function onSubmit(data: ProductFormData & { id?: string }) {
    if (!token || !organizationId) return;
    const { id, ...submitData } = data;
    try {
      if (id) {
        await updateMutation.mutateAsync({ id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      resetForm();
    } catch {
      // Error manejado por el hook
    }
  }

  async function deleteProduct(product: ProductType) {
    if (!token || !organizationId) return;
    if (!window.confirm(`¿Eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`)) return;
    await deleteMutation.mutateAsync(product.id);
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !filterCategory || p.category?.id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <OwnerShell active="products">
      <OwnerHeader eyebrow="Catálogo" title="Productos" />
      {createMutation.isError || updateMutation.isError || deleteMutation.isError ? (
        <p className="error-message" role="alert">
          {createMutation.error?.message || updateMutation.error?.message || deleteMutation.error?.message}
        </p>
      ) : null}
      {(createMutation.isSuccess || updateMutation.isSuccess) && (
        <p className="success-message">
          {editingId ? 'Producto actualizado correctamente' : 'Producto creado correctamente'}
        </p>
      )}

      <RequireRole roles={WRITE_ROLES}>
        <section className="panel">
          <span className="eyebrow">{editingId ? 'Edición' : 'Alta'}</span>
          <h2>{editingId ? 'Editar producto' : 'Nuevo producto'}</h2>
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
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sin categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin categoría</SelectItem>
                        {categories.map((category) => (
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
              <FormField
                control={form.control}
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sin unidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin unidad</SelectItem>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name}{unit.symbol ? ` (${unit.symbol})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {schemaFields.map(([key, definition]) => (
                <FormField
                  key={key}
                  control={form.control}
                  name={`attributes.${key}` as any}
                  render={({ field }) => {
                    const type = definition.type ?? 'string';
                    const label = definition.label ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
                    if (type === 'boolean') {
                      return (
                        <FormItem className="fractionable-field">
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="!mt-0 cursor-pointer">{label}</FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      );
                    }
                    if (type === 'number') {
                      return (
                        <FormItem>
                          <FormLabel>{label}</FormLabel>
                          <FormControl>
                            <Input type="number" step="any" {...field} value={field.value == null ? '' : String(field.value)} onChange={(e) => field.onChange(e.target.value)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }
                    if (type === 'date') {
                      return (
                        <FormItem>
                          <FormLabel>{label}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={typeof field.value === 'string' ? field.value : ''} onChange={(e) => field.onChange(e.target.value)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }
                    return (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input type="text" {...field} value={field.value ? String(field.value) : String(definition.default ?? '')} onChange={(e) => field.onChange(e.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              ))}
              {editingId && (
                <Button type="button" variant="link" className="quiet-link" onClick={resetForm}>
                  Cancelar edición
                </Button>
              )}
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? 'Guardar cambios' : 'Agregar producto'}
              </Button>
            </form>
          </Form>
        </section>
      </RequireRole>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Catálogo</span>
            <h2>Catálogo actual</h2>
          </div>
          <span className="role-badge">{filteredProducts.length} productos</span>
        </div>
        <div className="field-actions">
          <Input
            aria-label="Buscar productos"
            placeholder="Buscar por nombre o SKU..."
            value={search ?? ''}
            onChange={(e) => form.setValue('search' as any, e.target.value)}
          />
          <Select value={filterCategory ?? ''} onValueChange={(v) => form.setValue('filterCategory' as any, v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {loadingProducts ? (
          <p className="muted">Cargando...</p>
        ) : (
          <>
            {filteredProducts.map((product) => (
              <div className="list-row" key={product.id}>
                <span>
                  <strong>{product.name}</strong>
                  <small>{product.sku || 'Sin SKU'} · {product.category?.name || 'Sin categoría'} · {product.unit?.name || 'Sin unidad'}</small>
                </span>
                <span className="list-right">
                  <strong>{Number(product.price).toFixed(2)}</strong>
                  <RequireRole roles={WRITE_ROLES}>
                    <div className="row-actions">
                      <Button type="button" variant="link" className="quiet-link" onClick={() => startEdit(product)}>
                        Editar
                      </Button>
                    </div>
                  </RequireRole>
                  {canDelete && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="danger"
                      onClick={() => void deleteProduct(product)}
                      disabled={deleteMutation.isPending}
                    >
                      Eliminar
                    </Button>
                  )}
                </span>
              </div>
            ))}
            {!filteredProducts.length && (
              <p className="muted">No hay productos para mostrar.</p>
            )}
          </>
        )}
      </section>
    </OwnerShell>
  );
}
