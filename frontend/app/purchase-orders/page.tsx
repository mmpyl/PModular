'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { useAuth } from '@/contexts/AuthContext';
import {
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useReceivePurchaseOrder,
  useCancelPurchaseOrder,
  useBusinessEntities,
  useProducts,
  type PurchaseOrderStatus,
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

type OrderItemFormData = {
  productId: string;
  quantity: number;
  unitCost: number;
};

type CreateOrderFormData = {
  supplierId: string;
  items: OrderItemFormData[];
};

export default function PurchaseOrdersPage() {
  const { organizationId } = useAuth();
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | undefined>(undefined);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: orders = [], isLoading, refetch } = usePurchaseOrders(organizationId ?? undefined, statusFilter);
  const { data: suppliers = [] } = useBusinessEntities(organizationId ?? undefined, 'PROVEEDOR');
  const { data: products = [] } = useProducts(organizationId ?? undefined);
  const createOrder = useCreatePurchaseOrder(organizationId ?? undefined);
  const receiveOrder = useReceivePurchaseOrder(organizationId ?? undefined);
  const cancelOrder = useCancelPurchaseOrder(organizationId ?? undefined);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateOrderFormData>({
    defaultValues: { supplierId: '', items: [{ productId: '', quantity: 1, unitCost: 0 }] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const onCreateSubmit = async (data: CreateOrderFormData) => {
    await createOrder.mutateAsync(data);
    setCreateDialogOpen(false);
    reset();
    refetch();
  };

  const handleReceive = async (orderId: string) => {
    if (confirm('¿Marcar esta orden como recibida?')) {
      await receiveOrder.mutateAsync({ orderId, data: {} });
      refetch();
    }
  };

  const handleCancel = async (orderId: string) => {
    if (confirm('¿Cancelar esta orden? Esta acción no se puede deshacer.')) {
      await cancelOrder.mutateAsync(orderId);
      refetch();
    }
  };

  const getStatusBadgeVariant = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'RECEIVED':
        return 'default' as const;
      case 'PENDING':
        return 'secondary' as const;
      case 'DRAFT':
        return 'outline' as const;
      case 'CANCELLED':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const getStatusLabel = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'RECEIVED':
        return 'Recibida';
      case 'PENDING':
        return 'Pendiente';
      case 'DRAFT':
        return 'Borrador';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return status;
    }
  };

  return (
    <OwnerShell active="purchases">
      <OwnerHeader eyebrow="Abastecimiento" title="Órdenes de compra" />

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Historial</span>
            <h2>Órdenes registradas</h2>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter || 'all'}
              onValueChange={(value) =>
                setStatusFilter(value === 'all' ? undefined : (value as PurchaseOrderStatus))
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="DRAFT">Borrador</SelectItem>
                <SelectItem value="PENDING">Pendiente</SelectItem>
                <SelectItem value="RECEIVED">Recibida</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Nueva orden</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear orden de compra</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="supplierId">Proveedor</Label>
                    <select
                      id="supplierId"
                      className="w-full px-3 py-2 border rounded-md"
                      {...register('supplierId', { required: 'Requerido' })}
                    >
                      <option value="">Seleccionar...</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                    {errors.supplierId && (
                      <p className="text-sm text-red-500">{errors.supplierId.message}</p>
                    )}
                  </div>
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
                          <Label htmlFor={`items.${index}.unitCost`}>Costo</Label>
                          <Input
                            id={`items.${index}.unitCost`}
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full"
                            {...register(`items.${index}.unitCost`, {
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
                      onClick={() => append({ productId: '', quantity: 1, unitCost: 0 })}
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
                      disabled={createOrder.isPending || !suppliers.length}
                    >
                      {createOrder.isPending ? 'Guardando...' : 'Crear orden'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <p className="muted">Cargando órdenes...</p>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <div className="list-row items-center" key={order.id}>
                <span className="flex-1">
                  <strong>{order.orderNumber}</strong>
                  <small className="block">
                    {order.supplier?.name || 'Proveedor'} ·{' '}
                    {new Date(order.orderDate).toLocaleDateString('es-MX')}
                  </small>
                </span>
                <div className="flex items-center gap-4">
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {getStatusLabel(order.status)}
                  </Badge>
                  <span className="font-semibold">${Number(order.total).toFixed(2)}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setDetailDialogOpen(true);
                    }}
                  >
                    Ver detalle
                  </Button>
                  {order.status === 'PENDING' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleReceive(order.id)}
                        disabled={receiveOrder.isPending}
                      >
                        Recibir
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancel(order.id)}
                        disabled={cancelOrder.isPending}
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

        {!orders.length && !isLoading && (
          <p className="muted">No hay órdenes registradas.</p>
        )}
      </section>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de orden - {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Estado</Label>
                  <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>
                    {getStatusLabel(selectedOrder.status)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Fecha</Label>
                  <p>{new Date(selectedOrder.orderDate).toLocaleDateString('es-MX')}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Proveedor</Label>
                  <p>{selectedOrder.supplier?.name || 'Proveedor'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Total</Label>
                  <p className="font-semibold">${Number(selectedOrder.total).toFixed(2)}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Productos</Label>
                <div className="border rounded-md divide-y">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-2 flex justify-between text-sm">
                      <span>
                        {item.product?.name || 'Producto'} × {item.quantity}
                      </span>
                      <span>${Number(item.subtotal || item.unitCost * item.quantity).toFixed(2)}</span>
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