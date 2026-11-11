'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { useAuth } from '@/contexts/AuthContext';
import {
  useSales,
  useCreateSale,
  useCompleteSale,
  useCancelSale,
  useProducts,
  type SaleStatus,
} from '@/features/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type SaleItemFormData = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

type CreateSaleFormData = {
  items: SaleItemFormData[];
  customerId?: string;
};

export default function SalesPage() {
  const { organizationId } = useAuth();
  const [statusFilter, setStatusFilter] = useState<SaleStatus | undefined>(undefined);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const { data: sales = [], isLoading, refetch } = useSales(organizationId ?? undefined, statusFilter);
  const { data: products = [] } = useProducts(organizationId ?? undefined);
  const createSale = useCreateSale(organizationId ?? undefined);
  const completeSale = useCompleteSale(organizationId ?? undefined);
  const cancelSale = useCancelSale(organizationId ?? undefined);

  const selectedSale = sales.find((s) => s.id === selectedSaleId);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateSaleFormData>({
    defaultValues: { items: [{ productId: '', quantity: 1, unitPrice: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const onCreateSubmit = async (data: CreateSaleFormData) => {
    await createSale.mutateAsync(data);
    setCreateDialogOpen(false);
    reset();
    refetch();
  };

  const handleComplete = async (saleId: string) => {
    if (confirm('¿Completar esta venta?')) {
      await completeSale.mutateAsync(saleId);
      refetch();
    }
  };

  const handleCancel = async (saleId: string) => {
    if (confirm('¿Cancelar esta venta? Esta acción no se puede deshacer.')) {
      await cancelSale.mutateAsync(saleId);
      refetch();
    }
  };

  const getStatusBadgeVariant = (status: SaleStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'default' as const;
      case 'DRAFT':
        return 'secondary' as const;
      case 'CANCELLED':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const getStatusLabel = (status: SaleStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completada';
      case 'DRAFT':
        return 'Borrador';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return status;
    }
  };

  return (
    <OwnerShell active="sales">
      <OwnerHeader eyebrow="Operación" title="Ventas" />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-muted-foreground mb-1 block">Historial</span>
              <h2>Ventas registradas</h2>
            </div>
          </div>
            <div className="flex items-center gap-2">
              <Select
                value={statusFilter || 'all'}
                onValueChange={(value) =>
                  setStatusFilter(value === 'all' ? undefined : (value as SaleStatus))
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="DRAFT">Borrador</SelectItem>
                  <SelectItem value="COMPLETED">Completada</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">Nueva venta</Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Registrar nueva venta</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Productos</Label>
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label htmlFor={`items.${index}.productId`}>Producto</Label>
                          <select
                            id={`items.${index}.productId`}
                            className="w-full px-3 py-2 border rounded-md"
                            {...register(`items.${index}.productId`, { required: 'Requerido' })}
                          >
                            <option value="">Seleccionar...</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <Label htmlFor={`items.${index}.quantity`}>Cant.</Label>
                          <Input
                            id={`items.${index}.quantity`}
                            type="number"
                            min="1"
                            className="w-full"
                            {...register(`items.${index}.quantity`, {
                              required: 'Requerido',
                              min: { value: 1, message: 'Mínimo 1' },
                            })}
                          />
                        </div>
                        <div className="w-28">
                          <Label htmlFor={`items.${index}.unitPrice`}>Precio</Label>
                          <Input
                            id={`items.${index}.unitPrice`}
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full"
                            {...register(`items.${index}.unitPrice`, {
                              required: 'Requerido',
                              min: { value: 0, message: 'Mínimo 0' },
                            })}
                          />
                        </div>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ productId: '', quantity: 1, unitPrice: 0 })}
                    >
                      + Agregar producto
                    </Button>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createSale.isPending || !products.length}
                    >
                      {createSale.isPending ? 'Guardando...' : 'Crear venta'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Cargando ventas...</p>
          ) : (
            <div className="space-y-2">
              {sales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 border rounded-md">
                  <span className="flex-1">
                    <strong className="block">{sale.saleNumber}</strong>
                    <small className="text-muted-foreground">
                      {new Date(sale.saleDate).toLocaleDateString('es-MX')} ·{' '}
                      {sale.customer?.name || 'Cliente general'}
                    </small>
                  </span>
                  <div className="flex items-center gap-4">
                    <Badge variant={getStatusBadgeVariant(sale.status)}>
                      {getStatusLabel(sale.status)}
                    </Badge>
                    <span className="font-semibold">${Number(sale.total).toFixed(2)}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedSaleId(sale.id);
                        setDetailDialogOpen(true);
                      }}
                    >
                      Ver detalle
                    </Button>
                    {sale.status === 'DRAFT' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleComplete(sale.id)}
                          disabled={completeSale.isPending}
                        >
                          Completar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancel(sale.id)}
                          disabled={cancelSale.isPending}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!sales.length && !isLoading && (
            <p className="text-muted-foreground text-sm">No hay ventas registradas.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de venta - {selectedSale?.saleNumber}</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Estado</Label>
                  <Badge variant={getStatusBadgeVariant(selectedSale.status)}>
                    {getStatusLabel(selectedSale.status)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Fecha</Label>
                  <p>{new Date(selectedSale.saleDate).toLocaleDateString('es-MX')}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Cliente</Label>
                  <p>{selectedSale.customer?.name || 'Cliente general'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Total</Label>
                  <p className="font-semibold">${Number(selectedSale.total).toFixed(2)}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Productos</Label>
                <div className="border rounded-md divide-y">
                  {selectedSale.items.map((item, idx) => (
                    <div key={idx} className="p-2 flex justify-between text-sm">
                      <span>
                        {item.product?.name || 'Producto'} × {item.quantity}
                      </span>
                      <span>${Number(item.subtotal || item.unitPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </OwnerShell>
  );
}
