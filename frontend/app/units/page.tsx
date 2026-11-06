'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { RequireRole } from '@/components/RequireRole';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUnits, useCreateUnit, useUpdateUnit, useDeleteUnit, type Unit } from '@/features/catalog/hooks';
import { unitSchema, type UnitFormData } from '@/features/catalog/schemas';
import { CheckCircle2, XCircle } from 'lucide-react';

// Crear/editar: OWNER/ADMIN/INVENTARIO. Eliminar: solo OWNER/ADMIN (backend).
const WRITE_ROLES = ['OWNER', 'ADMIN', 'INVENTARIO'];
const DELETE_ROLES = ['OWNER', 'ADMIN'];

export default function UnitsPage() {
<<<<<<< HEAD
  const { token, organizationId } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [isFractionable, setIsFractionable] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
=======
  const { token, organizationId, orgRole } = useAuth();
  const { data: units = [], isLoading } = useUnits(organizationId ?? undefined);
  const createMutation = useCreateUnit(organizationId ?? undefined);
  const updateMutation = useUpdateUnit(organizationId ?? undefined);
  const deleteMutation = useDeleteUnit(organizationId ?? undefined);
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540

  const form = useForm<UnitFormData & { id?: string }>({
    resolver: zodResolver(unitSchema) as any,
    defaultValues: { name: '', symbol: '', isFractionable: false },
  });

  const editingId = form.watch('id') as string | undefined;

  const canWrite = orgRole !== null && WRITE_ROLES.includes(orgRole);
  const canDelete = orgRole !== null && DELETE_ROLES.includes(orgRole);

  function resetForm() {
    form.reset({ name: '', symbol: '', isFractionable: false });
  }

  function startEdit(unit: Unit) {
    form.reset({ id: unit.id, name: unit.name, symbol: unit.symbol ?? '', isFractionable: unit.isFractionable });
  }

  async function onSubmit(data: UnitFormData & { id?: string }) {
    if (!token || !organizationId) return;
    const { id, ...submitData } = data;
    try {
<<<<<<< HEAD
      let successMessage: string;
      if (editingId) {
        await apiFetch(`/units-of-measure/${editingId}`, { method: 'PATCH', token, organizationId, body });
        successMessage = 'Unidad actualizada correctamente';
      } else {
        await apiFetch('/units-of-measure', { method: 'POST', token, organizationId, body });
        successMessage = 'Unidad creada correctamente';
      }
      setError(''); resetForm(); setMessage(successMessage); await load();
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar la unidad');
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

  async function remove(unit: Unit) {
    if (!token || !organizationId) return;
    if (!window.confirm(`¿Eliminar la unidad "${unit.name}"?`)) return;
    await deleteMutation.mutateAsync(unit.id);
  }

<<<<<<< HEAD
  useEffect(() => { void load(); }, [token, organizationId]);
  const filteredUnits = units.filter((unit) => `${unit.name} ${unit.symbol ?? ''}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));

=======
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540
  return (
    <OwnerShell active="units">
      <OwnerHeader eyebrow="Catálogo" title="Unidades de medida" />
      
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
            {editingId ? 'Unidad actualizada correctamente' : 'Unidad creada correctamente'}
          </AlertDescription>
        </Alert>
      )}

      <div className="catalog-layout">
      <RequireRole roles={WRITE_ROLES}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{editingId ? 'Editar unidad' : 'Nueva unidad'}</CardTitle>
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
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Símbolo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isFractionable"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0 cursor-pointer">¿Vendible fraccionado?</FormLabel>
                      </div>
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
                    {editingId ? 'Guardar cambios' : 'Agregar unidad'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </RequireRole>

<<<<<<< HEAD
      <section className="panel">
        <div className="panel-heading">
          <div><span className="eyebrow">Catálogo</span><h2>Unidades disponibles</h2></div>
          <span className="role-badge">{units.length} unidades</span>
        </div>
        <div className="catalog-search-row"><input aria-label="Buscar unidades" placeholder="Buscar unidad o símbolo..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        {filteredUnits.map((unit) => (
          <div className="list-row" key={unit.id}>
            <span>
              <strong>{unit.name}</strong>
              <small>{unit.symbol || 'Sin símbolo'}{unit.isFractionable ? ' · Fraccionable' : ''}</small>
            </span>
            <RequireRole roles={WRITE_ROLES}>
              <div className="row-actions">
                <button type="button" className="quiet-link" onClick={() => startEdit(unit)}>Editar</button>
              </div>
            </RequireRole>
            <RequireRole roles={DELETE_ROLES}>
              <div className="row-actions">
                <button type="button" className="danger" onClick={() => void remove(unit)}>Eliminar</button>
              </div>
            </RequireRole>
          </div>
        ))}
        {!filteredUnits.length && <p className="muted">{units.length ? 'No hay unidades que coincidan con la búsqueda.' : 'No hay unidades registradas.'}</p>}
      </section>
      </div>
=======
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Catálogo</div>
              <CardTitle>Unidades disponibles</CardTitle>
            </div>
            <Badge variant="secondary">{units.length} unidades</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <>
              {units.map((unit) => (
                <div className="flex items-center justify-between py-3 border-b last:border-0" key={unit.id}>
                  <div>
                    <div className="font-medium">{unit.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {unit.symbol || 'Sin símbolo'}
                      {unit.isFractionable ? ' · Fraccionable' : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RequireRole roles={WRITE_ROLES}>
                      <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(unit)}>
                        Editar
                      </Button>
                    </RequireRole>
                    <RequireRole roles={DELETE_ROLES}>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => void remove(unit)}
                        disabled={deleteMutation.isPending}
                      >
                        Eliminar
                      </Button>
                    </RequireRole>
                  </div>
                </div>
              ))}
              {!units.length && (
                <p className="text-sm text-muted-foreground">No hay unidades registradas.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540
    </OwnerShell>
  );
}
