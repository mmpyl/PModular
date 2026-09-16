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
import { useUnits, useCreateUnit, useUpdateUnit, useDeleteUnit, type Unit } from '@/features/catalog/hooks';
import { unitSchema, type UnitFormData } from '@/features/catalog/schemas';

// Crear/editar: OWNER/ADMIN/INVENTARIO. Eliminar: solo OWNER/ADMIN (backend).
const WRITE_ROLES = ['OWNER', 'ADMIN', 'INVENTARIO'];
const DELETE_ROLES = ['OWNER', 'ADMIN'];

export default function UnitsPage() {
  const { token, organizationId, orgRole } = useAuth();
  const { data: units = [], isLoading } = useUnits(organizationId ?? undefined);
  const createMutation = useCreateUnit(organizationId ?? undefined);
  const updateMutation = useUpdateUnit(organizationId ?? undefined);
  const deleteMutation = useDeleteUnit(organizationId ?? undefined);

  const form = useForm<UnitFormData & { id?: string }>({
    resolver: zodResolver(unitSchema),
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

  async function remove(unit: Unit) {
    if (!token || !organizationId) return;
    if (!window.confirm(`¿Eliminar la unidad "${unit.name}"?`)) return;
    await deleteMutation.mutateAsync(unit.id);
  }

  return (
    <OwnerShell active="units">
      <OwnerHeader eyebrow="Catálogo" title="Unidades de medida" />
      {createMutation.isError || updateMutation.isError || deleteMutation.isError ? (
        <p className="error-message" role="alert">
          {createMutation.error?.message || updateMutation.error?.message || deleteMutation.error?.message}
        </p>
      ) : null}
      {(createMutation.isSuccess || updateMutation.isSuccess) && (
        <p className="success-message">
          {editingId ? 'Unidad actualizada correctamente' : 'Unidad creada correctamente'}
        </p>
      )}

      <RequireRole roles={WRITE_ROLES}>
        <section className="panel">
          <span className="eyebrow">{editingId ? 'Edición' : 'Alta'}</span>
          <h2>{editingId ? 'Editar unidad' : 'Nueva unidad'}</h2>
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
                  <FormItem className="fractionable-field">
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
              {editingId && (
                <Button type="button" variant="link" className="quiet-link" onClick={resetForm}>
                  Cancelar edición
                </Button>
              )}
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? 'Guardar cambios' : 'Agregar unidad'}
              </Button>
            </form>
          </Form>
        </section>
      </RequireRole>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Catálogo</span>
            <h2>Unidades disponibles</h2>
          </div>
          <span className="role-badge">{units.length} unidades</span>
        </div>
        {isLoading ? (
          <p className="muted">Cargando...</p>
        ) : (
          <>
            {units.map((unit) => (
              <div className="list-row" key={unit.id}>
                <span>
                  <strong>{unit.name}</strong>
                  <small>{unit.symbol || 'Sin símbolo'}{unit.isFractionable ? ' · Fraccionable' : ''}</small>
                </span>
                <RequireRole roles={WRITE_ROLES}>
                  <div className="row-actions">
                    <Button type="button" variant="link" className="quiet-link" onClick={() => startEdit(unit)}>
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
                      onClick={() => void remove(unit)}
                      disabled={deleteMutation.isPending}
                    >
                      Eliminar
                    </Button>
                  </div>
                </RequireRole>
              </div>
            ))}
            {!units.length && (
              <p className="muted">No hay unidades registradas.</p>
            )}
          </>
        )}
      </section>
    </OwnerShell>
  );
}
