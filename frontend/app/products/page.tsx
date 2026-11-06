'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { RequireRole } from '@/components/RequireRole';
import { useAuth } from '@/contexts/AuthContext';
<<<<<<< HEAD
import { apiFetch, ApiError } from '@/lib/api';
import { formatMoney } from '@/lib/format';

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  price: number | string;
  cost?: number | string | null;
  isActive: boolean;
  attributes?: Record<string, unknown>;
  category?: { id: string; name: string } | null;
  unit?: { id: string; name: string; symbol?: string | null } | null;
};

type Category = { id: string; name: string };
type Unit = { id: string; name: string; symbol?: string | null; isFractionable: boolean };
type OrganizationSettings = { settings?: { currency?: string | null } };
=======
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProducts, useCategories, useUnits, useCreateProduct, useUpdateProduct, useDeleteProduct, type Product as ProductType } from '@/features/catalog/hooks';
import { productSchema, type ProductFormData } from '@/features/catalog/schemas';
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540

type SchemaField = { type?: string; default?: unknown; options?: unknown[]; label?: string };

// Crear/editar catálogo: OWNER/ADMIN/INVENTARIO (espejo del OrgRolesGuard del backend)
const WRITE_ROLES = ['OWNER', 'ADMIN', 'INVENTARIO'];
// Eliminar productos: OWNER/ADMIN según el backend
const DELETE_ROLES = ['OWNER', 'ADMIN'];

export default function ProductsPage() {
  const { token, organizationId, orgRole, memberships } = useAuth();
<<<<<<< HEAD
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [currency, setCurrency] = useState('PEN');
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [attributes, setAttributes] = useState<Record<string, unknown>>({});
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
=======
  const { data: products = [], isLoading: loadingProducts } = useProducts(organizationId ?? undefined);
  const { data: categories = [] } = useCategories(organizationId ?? undefined);
  const { data: units = [] } = useUnits(organizationId ?? undefined);
  const createMutation = useCreateProduct(organizationId ?? undefined);
  const updateMutation = useUpdateProduct(organizationId ?? undefined);
  const deleteMutation = useDeleteProduct(organizationId ?? undefined);
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540

  // productSchema del BusinessType de la membresía activa
  const activeMembership = memberships.find((m) => m.organizationId === organizationId) ?? null;
  const productSchemaDef = activeMembership?.organization?.businessType?.productSchema ?? {} as Record<string, SchemaField>;
  const schemaFields = Object.entries(productSchemaDef);

  const form = useForm<ProductFormData & { id?: string; attributes: Record<string, unknown>; search?: string; filterCategory?: string }>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      sku: '',
      price: 0,
      cost: undefined,
      categoryId: null,
      unitId: null,
      attributes: {},
      lowStockThreshold: 10,
      search: '',
      filterCategory: '',
    },
  });

  const editingId = form.watch('id') as string | undefined;
  const search = form.watch('search');
  const filterCategory = form.watch('filterCategory');

  const canWrite = orgRole !== null && WRITE_ROLES.includes(orgRole);
  const canDelete = orgRole !== null && DELETE_ROLES.includes(orgRole);

<<<<<<< HEAD
  const loadProducts = useCallback(async () => {
    if (!token || !organizationId) return;
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterCategory) params.set('categoryId', filterCategory);
      const qs = params.toString();
      setProducts(await apiFetch<Product[]>(`/products${qs ? `?${qs}` : ''}`, { token, organizationId }));
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudieron cargar los productos');
    }
  }, [token, organizationId, search, filterCategory]);

  const loadReferences = useCallback(async () => {
    if (!token || !organizationId) return;
    try {
      const [catRows, unitRows, organization] = await Promise.all([
        apiFetch<Category[]>('/categories', { token, organizationId }),
        apiFetch<Unit[]>('/units-of-measure', { token, organizationId }),
        apiFetch<OrganizationSettings>(`/organizations/${organizationId}`, { token, organizationId }),
      ]);
      setCategories(catRows);
      setUnits(unitRows);
      setCurrency(organization.settings?.currency || 'PEN');
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudieron cargar categorías y unidades');
    }
  }, [token, organizationId]);

  useEffect(() => { void loadProducts(); }, [loadProducts]);
  useEffect(() => { void loadReferences(); }, [loadReferences]);

=======
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540
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
      lowStockThreshold: 10,
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
      lowStockThreshold: product.lowStockThreshold != null ? Number(product.lowStockThreshold) : 10,
    });
  }

  async function onSubmit(data: ProductFormData & { id?: string }) {
    if (!token || !organizationId) return;
    const { id, ...submitData } = data;
    try {
<<<<<<< HEAD
      let successMessage: string;
      if (editingId) {
        await apiFetch(`/products/${editingId}`, { method: 'PATCH', token, organizationId, body: JSON.stringify(payload) });
        successMessage = 'Producto actualizado correctamente';
      } else {
        await apiFetch('/products', { method: 'POST', token, organizationId, body: JSON.stringify(payload) });
        successMessage = 'Producto creado correctamente';
      }
      setError(''); resetForm(); setMessage(successMessage); await loadProducts();
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo guardar el producto');
=======
      if (id) {
        await updateMutation.mutateAsync({ id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      resetForm();
    } catch {
      // Error manejado por el hook
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540
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
      {(createMutation.isError || updateMutation.isError || deleteMutation.isError) && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {createMutation.error?.message || updateMutation.error?.message || deleteMutation.error?.message}
          </AlertDescription>
        </Alert>
      )}
      {(createMutation.isSuccess || updateMutation.isSuccess) && (
        <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
          <AlertDescription>
            {editingId ? 'Producto actualizado correctamente' : 'Producto creado correctamente'}
          </AlertDescription>
        </Alert>
      )}

      <RequireRole roles={WRITE_ROLES}>
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <span className="text-sm text-muted-foreground mb-1">{editingId ? 'Edición' : 'Alta'}</span>
            <h2 className="text-lg font-semibold">{editingId ? 'Editar producto' : 'Nuevo producto'}</h2>
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
              <FormField
                control={form.control}
                name="lowStockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Umbral de stock bajo</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {schemaFields.map(([key, definition]) => {
                  const def = definition as SchemaField;
                  return (
                <FormField
                  key={key}
                  control={form.control}
                  name={`attributes.${key}` as any}
                  render={({ field }) => {
                    const type = def.type ?? 'string';
                    const label = def.label ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
                    if (type === 'boolean') {
                      return (
                        <FormItem>
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
                          <Input type="text" {...field} value={field.value ? String(field.value) : String(def.default ?? '')} onChange={(e) => field.onChange(e.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              );})}
              {editingId && (
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Cancelar edición
                </Button>
              )}
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? 'Guardar cambios' : 'Agregar producto'}
              </Button>
            </form>
          </Form>
          </CardContent>
        </Card>
      </RequireRole>

<<<<<<< HEAD
      <section className="panel">
        <div className="panel-heading">
          <div><span className="eyebrow">Catálogo</span><h2>Catálogo actual</h2></div>
          <span className="role-badge">{products.length} productos</span>
        </div>
        <div className="field-actions">
          <input aria-label="Buscar productos" placeholder="Buscar por nombre o SKU..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select aria-label="Filtrar por categoría" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </div>
        {products.length ? <div className="platform-table-wrap">
          <table className="platform-table products-table">
            <thead><tr><th>Producto</th><th>SKU</th><th>Categoría</th><th>Unidad</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>{products.map((product) => <tr key={product.id}>
              <td><strong>{product.name}</strong></td>
              <td>{product.sku || '-'}</td>
              <td>{product.category?.name || '-'}</td>
              <td>{product.unit?.name || '-'}</td>
              <td><strong>{formatMoney(product.price, currency)}</strong></td>
              <td><span className="role-badge">{product.isActive ? 'Activo' : 'Inactivo'}</span></td>
              <td><div className="platform-actions">
                <RequireRole roles={WRITE_ROLES}>
                  <button type="button" className="quiet-link" onClick={() => startEdit(product)}>Editar</button>
                </RequireRole>
                {canDelete && <button type="button" className="danger" onClick={() => void deleteProduct(product)}>Eliminar</button>}
              </div></td>
            </tr>)}</tbody>
          </table>
        </div> : <p className="muted">No hay productos para mostrar.</p>}
      </section>
=======
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-muted-foreground mb-1 block">Catálogo</span>
              <h2 className="text-lg font-semibold">Catálogo actual</h2>
            </div>
            <Badge variant="secondary">{filteredProducts.length} productos</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              aria-label="Buscar productos"
              placeholder="Buscar por nombre o SKU..."
              value={search ?? ''}
              onChange={(e) => form.setValue('search', e.target.value)}
              className="flex-1"
            />
            <Select value={filterCategory ?? ''} onValueChange={(v) => form.setValue('filterCategory', v)}>
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
            <p className="text-muted-foreground text-sm">Cargando...</p>
          ) : (
            <>
              <div className="space-y-2">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted">
                    <div>
                      <strong className="block">{product.name}</strong>
                      <small className="text-muted-foreground">{product.sku || 'Sin SKU'} · {product.category?.name || 'Sin categoría'} · {product.unit?.name || 'Sin unidad'}</small>
                      <div className="text-xs text-muted-foreground mt-1">Umbral stock bajo: {product.lowStockThreshold ?? 10}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <strong>{Number(product.price).toFixed(2)}</strong>
                      <RequireRole roles={WRITE_ROLES}>
                        <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(product)}>
                          Editar
                        </Button>
                      </RequireRole>
                      {canDelete && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => void deleteProduct(product)}
                          disabled={deleteMutation.isPending}
                        >
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {!filteredProducts.length && (
                <p className="text-muted-foreground text-sm">No hay productos para mostrar.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540
    </OwnerShell>
  );
}
