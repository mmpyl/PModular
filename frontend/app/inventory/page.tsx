'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { useAuth } from '@/contexts/AuthContext';
import {
  useInventory,
  useUpdateInventory,
  useProducts,
} from '@/features/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

type AdjustStockFormData = {
  quantity: number;
  reason?: string;
};

export default function InventoryPage() {
  const { token, organizationId } = useAuth();
  const { data: items = [], isLoading, error } = useInventory(organizationId ?? undefined);
  const updateInventory = useUpdateInventory(organizationId ?? undefined);
  const { data: products = [] } = useProducts(organizationId ?? undefined);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const selectedItem = items.find((item) => item.id === selectedItemId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AdjustStockFormData>();

  const handleAdjustStock = (item: typeof selectedItem) => {
    if (!item) return;
    setSelectedItemId(item.id);
    setValue('quantity', item.quantity);
    setAdjustDialogOpen(true);
  };

  const onSubmit = async (data: AdjustStockFormData) => {
    if (!selectedItemId) return;
    await updateInventory.mutateAsync({
      id: selectedItemId,
      data: { quantity: data.quantity },
    });
    setAdjustDialogOpen(false);
    reset();
  };

  const handleRecalculate = async (productId: string) => {
    // TODO: Implementar hook useRecalculateInventory si se necesita
    console.log('Recalcular inventario para producto:', productId);
  };

  return (
    <OwnerShell active="inventory">
      <OwnerHeader eyebrow="Control operativo" title="Inventario" />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-muted-foreground mb-1 block">Existencias</span>
              <h2>Stock por producto</h2>
            </div>
            <Badge variant="secondary">{items.length} registros</Badge>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Cargando inventario...</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-md">
                  <span className="flex-1">
                    <strong className="block">{item.product.name}</strong>
                    <small className="text-muted-foreground">
                      {item.product.sku || 'Sin SKU'} · Reservado: {item.reserved}
                    </small>
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">
                      {item.quantity} uds. · ${Number(item.averageCost).toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleAdjustStock(item)}
                      disabled={updateInventory.isPending}
                    >
                      Ajustar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!items.length && !isLoading && !error && (
            <p className="text-muted-foreground text-sm">No hay existencias registradas todavía.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar stock - {selectedItem?.product.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="quantity">Cantidad actual</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                {...register('quantity', { 
                  required: 'La cantidad es requerida',
                  min: { value: 0, message: 'La cantidad no puede ser negativa' }
                })}
              />
              {errors.quantity && (
                <p className="text-sm text-red-500">{errors.quantity.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="reason">Motivo del ajuste (opcional)</Label>
              <Input
                id="reason"
                type="text"
                placeholder="Ej: Corrección de inventario, merma, etc."
                {...register('reason')}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdjustDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateInventory.isPending}>
                {updateInventory.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </OwnerShell>
  );
}