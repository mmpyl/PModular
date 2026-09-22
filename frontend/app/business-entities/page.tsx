'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { useAuth } from '@/contexts/AuthContext';
import {
  useBusinessEntities,
  useCreateBusinessEntity,
  useUpdateBusinessEntity,
  useDeleteBusinessEntity,
  useBusinessEntityWithHistory,
  type BusinessEntityType,
  type BusinessEntity,
  type BusinessEntityWithHistory,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type EntityFormData = {
  name: string;
  entityType: BusinessEntityType;
  taxId?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  creditLimit?: number;
};

export default function BusinessEntitiesPage() {
  const { organizationId } = useAuth();
  const [typeFilter, setTypeFilter] = useState<BusinessEntityType | undefined>(undefined);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: entities = [], isLoading, refetch } = useBusinessEntities(organizationId ?? undefined, typeFilter, searchTerm);
  const createEntity = useCreateBusinessEntity(organizationId ?? undefined);
  const updateEntity = useUpdateBusinessEntity(organizationId ?? undefined);
  const deleteEntity = useDeleteBusinessEntity(organizationId ?? undefined);
  const { data: selectedEntity, refetch: refetchDetail } = useBusinessEntityWithHistory(organizationId ?? undefined, selectedEntityId ?? undefined);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EntityFormData>({
    defaultValues: {
      name: '',
      entityType: 'CLIENTE',
      taxId: '',
      email: '',
      phone: '',
      mobile: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      notes: '',
      creditLimit: undefined,
    },
  });

  const onCreateSubmit = async (data: EntityFormData) => {
    await createEntity.mutateAsync(data);
    setCreateDialogOpen(false);
    reset();
    refetch();
  };

  const onEditSubmit = async (data: EntityFormData) => {
    if (selectedEntityId) {
      await updateEntity.mutateAsync({ id: selectedEntityId, data });
      setEditDialogOpen(false);
      reset();
      refetch();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta entidad? Esta acción no se puede deshacer.')) {
      await deleteEntity.mutateAsync(id);
      refetch();
    }
  };

  const openEditDialog = (entity: BusinessEntity) => {
    setSelectedEntityId(entity.id);
    reset({
      name: entity.name,
      entityType: entity.entityType,
      taxId: entity.taxId || '',
      email: entity.email || '',
      phone: entity.phone || '',
      mobile: entity.mobile || '',
      address: entity.address || '',
      city: entity.city || '',
      state: entity.state || '',
      postalCode: entity.postalCode || '',
      country: entity.country || '',
      contactName: entity.contactName || '',
      contactEmail: entity.contactEmail || '',
      contactPhone: entity.contactPhone || '',
      notes: entity.notes || '',
      creditLimit: entity.creditLimit || undefined,
    });
    setEditDialogOpen(true);
  };

  const getTypeBadgeVariant = (type: BusinessEntityType) => {
    switch (type) {
      case 'CLIENTE':
        return 'default' as const;
      case 'PROVEEDOR':
        return 'secondary' as const;
      case 'AMBOS':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  const getTypeLabel = (type: BusinessEntityType) => {
    switch (type) {
      case 'CLIENTE':
        return 'Cliente';
      case 'PROVEEDOR':
        return 'Proveedor';
      case 'AMBOS':
        return 'Ambos';
      default:
        return type;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  return (
    <OwnerShell active="business-entities">
      <OwnerHeader eyebrow="Gestión" title="Clientes y Proveedores" />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-500 mb-1 block">Directorio</span>
              <h2>Entidades comerciales</h2>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[200px]"
              />
              <Select
                value={typeFilter || 'all'}
                onValueChange={(value) =>
                  setTypeFilter(value === 'all' ? undefined : (value as BusinessEntityType))
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="CLIENTE">Clientes</SelectItem>
                  <SelectItem value="PROVEEDOR">Proveedores</SelectItem>
                  <SelectItem value="AMBOS">Ambos</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">Nueva entidad</Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Registrar nueva entidad comercial</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre *</Label>
                        <Input
                          id="name"
                          {...register('name', { required: 'Requerido' })}
                        />
                        {errors.name && (
                          <p className="text-red-500 text-xs">{errors.name.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="entityType">Tipo *</Label>
                        <select
                          id="entityType"
                          className="w-full px-3 py-2 border rounded-md"
                          {...register('entityType', { required: 'Requerido' })}
                        >
                          <option value="CLIENTE">Cliente</option>
                          <option value="PROVEEDOR">Proveedor</option>
                          <option value="AMBOS">Ambos</option>
                        </select>
                        {errors.entityType && (
                          <p className="text-red-500 text-xs">{errors.entityType.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taxId">RFC / NIT / RUC</Label>
                        <Input id="taxId" {...register('taxId')} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="creditLimit">Límite de crédito</Label>
                        <Input
                          id="creditLimit"
                          type="number"
                          step="0.01"
                          {...register('creditLimit', { valueAsNumber: true })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" {...register('email')} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input id="phone" {...register('phone')} />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input id="address" {...register('address')} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Ciudad</Label>
                        <Input id="city" {...register('city')} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">Estado / Provincia</Label>
                        <Input id="state" {...register('state')} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Código Postal</Label>
                        <Input id="postalCode" {...register('postalCode')} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">País</Label>
                        <Input id="country" {...register('country')} />
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h3 className="text-sm font-medium mb-3">Información de contacto</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contactName">Nombre del contacto</Label>
                          <Input id="contactName" {...register('contactName')} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactEmail">Email de contacto</Label>
                          <Input id="contactEmail" type="email" {...register('contactEmail')} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactPhone">Teléfono de contacto</Label>
                          <Input id="contactPhone" {...register('contactPhone')} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notas</Label>
                      <textarea
                        id="notes"
                        rows={3}
                        className="w-full px-3 py-2 border rounded-md resize-none"
                        {...register('notes')}
                      />
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
                        disabled={createEntity.isPending}
                      >
                        {createEntity.isPending ? 'Guardando...' : 'Crear entidad'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-gray-500 text-sm">Cargando entidades...</p>
          ) : (
            <div className="space-y-2">
              {entities.map((entity) => (
                <div key={entity.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <strong className="block">{entity.name}</strong>
                      <Badge variant={getTypeBadgeVariant(entity.entityType)}>
                        {getTypeLabel(entity.entityType)}
                      </Badge>
                    </div>
                    <small className="text-gray-500">
                      {entity.taxId && <span>{entity.taxId} · </span>}
                      {entity.email && <span>{entity.email}</span>}
                      {entity.phone && <span> · {entity.phone}</span>}
                      {entity.creditLimit && (
                        <span className="ml-2 text-blue-600">
                          Límite: {formatCurrency(entity.creditLimit)}
                        </span>
                      )}
                      {entity.currentBalance !== null && entity.currentBalance !== undefined && (
                        <span className={`ml-2 ${Number(entity.currentBalance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          Saldo: {formatCurrency(Number(entity.currentBalance))}
                        </span>
                      )}
                    </small>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedEntityId(entity.id);
                        setDetailDialogOpen(true);
                      }}
                    >
                      Ver detalle
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(entity)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(entity.id)}
                      disabled={deleteEntity.isPending}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!entities.length && !isLoading && (
            <p className="text-gray-500 text-sm">No hay entidades registradas.</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar entidad comercial</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre *</Label>
                <Input
                  id="edit-name"
                  {...register('name', { required: 'Requerido' })}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-entityType">Tipo *</Label>
                <select
                  id="edit-entityType"
                  className="w-full px-3 py-2 border rounded-md"
                  {...register('entityType', { required: 'Requerido' })}
                >
                  <option value="CLIENTE">Cliente</option>
                  <option value="PROVEEDOR">Proveedor</option>
                  <option value="AMBOS">Ambos</option>
                </select>
                {errors.entityType && (
                  <p className="text-red-500 text-xs">{errors.entityType.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-taxId">RFC / NIT / RUC</Label>
                <Input id="edit-taxId" {...register('taxId')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-creditLimit">Límite de crédito</Label>
                <Input
                  id="edit-creditLimit"
                  type="number"
                  step="0.01"
                  {...register('creditLimit', { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" {...register('email')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Teléfono</Label>
                <Input id="edit-phone" {...register('phone')} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="edit-address">Dirección</Label>
                <Input id="edit-address" {...register('address')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-city">Ciudad</Label>
                <Input id="edit-city" {...register('city')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">Estado / Provincia</Label>
                <Input id="edit-state" {...register('state')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-postalCode">Código Postal</Label>
                <Input id="edit-postalCode" {...register('postalCode')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-country">País</Label>
                <Input id="edit-country" {...register('country')} />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium mb-3">Información de contacto</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-contactName">Nombre del contacto</Label>
                  <Input id="edit-contactName" {...register('contactName')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-contactEmail">Email de contacto</Label>
                  <Input id="edit-contactEmail" type="email" {...register('contactEmail')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-contactPhone">Teléfono de contacto</Label>
                  <Input id="edit-contactPhone" {...register('contactPhone')} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notas</Label>
              <textarea
                id="edit-notes"
                rows={3}
                className="w-full px-3 py-2 border rounded-md resize-none"
                {...register('notes')}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateEntity.isPending}
              >
                {updateEntity.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog with History */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de entidad - {selectedEntity?.name}</DialogTitle>
          </DialogHeader>
          {selectedEntity && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList>
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="history">Historial</TabsTrigger>
                <TabsTrigger value="financial">Financiero</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Tipo</Label>
                    <Badge variant={getTypeBadgeVariant(selectedEntity.entityType)}>
                      {getTypeLabel(selectedEntity.entityType)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">RFC / NIT / RUC</Label>
                    <p>{selectedEntity.taxId || 'No especificado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <p>{selectedEntity.email || 'No especificado'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Teléfono</Label>
                    <p>{selectedEntity.phone || 'No especificado'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm text-muted-foreground">Dirección</Label>
                    <p>
                      {[selectedEntity.address, selectedEntity.city, selectedEntity.state, selectedEntity.postalCode, selectedEntity.country]
                        .filter(Boolean)
                        .join(', ') || 'No especificado'}
                    </p>
                  </div>
                  {selectedEntity.contactName && (
                    <>
                      <div>
                        <Label className="text-sm text-muted-foreground">Contacto</Label>
                        <p>{selectedEntity.contactName}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Email de contacto</Label>
                        <p>{selectedEntity.contactEmail || 'No especificado'}</p>
                      </div>
                    </>
                  )}
                  {selectedEntity.notes && (
                    <div className="col-span-2">
                      <Label className="text-sm text-muted-foreground">Notas</Label>
                      <p className="whitespace-pre-wrap">{selectedEntity.notes}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Últimas compras</h4>
                    {(selectedEntity as BusinessEntityWithHistory).purchaseOrders?.length ? (
                      <div className="space-y-2">
                        {(selectedEntity as BusinessEntityWithHistory).purchaseOrders?.map((po) => (
                          <div key={po.id} className="p-2 border rounded-md text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium">{po.orderNumber}</span>
                              <Badge variant={po.status === 'COMPLETADA' ? 'default' : 'secondary'}>
                                {po.status}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-gray-500">
                              <span>{new Date(po.createdAt).toLocaleDateString('es-MX')}</span>
                              <span>${Number(po.totalAmount).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No hay compras registradas</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Últimas ventas</h4>
                    {(selectedEntity as BusinessEntityWithHistory).sales?.length ? (
                      <div className="space-y-2">
                        {(selectedEntity as BusinessEntityWithHistory).sales?.map((sale) => (
                          <div key={sale.id} className="p-2 border rounded-md text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium">{sale.invoiceNumber}</span>
                              <Badge variant={sale.status === 'COMPLETADA' ? 'default' : 'secondary'}>
                                {sale.status}
                              </Badge>
                            </div>
                            <div className="flex justify-between text-gray-500">
                              <span>{new Date(sale.createdAt).toLocaleDateString('es-MX')}</span>
                              <span>${Number(sale.totalAmount).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No hay ventas registradas</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 border rounded-md bg-blue-50">
                    <Label className="text-sm text-muted-foreground">Total Compras</Label>
                    <p className="text-2xl font-bold text-blue-700">
                      {formatCurrency((selectedEntity as BusinessEntityWithHistory).totalPurchases || 0)}
                    </p>
                  </div>
                  <div className="p-4 border rounded-md bg-green-50">
                    <Label className="text-sm text-muted-foreground">Total Ventas</Label>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency((selectedEntity as BusinessEntityWithHistory).totalSales || 0)}
                    </p>
                  </div>
                  <div className="p-4 border rounded-md bg-purple-50">
                    <Label className="text-sm text-muted-foreground">Saldo Calculado</Label>
                    <p className={`text-2xl font-bold ${(selectedEntity as BusinessEntityWithHistory).calculatedBalance && Number((selectedEntity as BusinessEntityWithHistory).calculatedBalance) > 0 ? 'text-red-700' : 'text-green-700'}`}>
                      {formatCurrency((selectedEntity as BusinessEntityWithHistory).calculatedBalance || 0)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Límite de Crédito</Label>
                    <p className="text-lg font-semibold">
                      {selectedEntity.creditLimit ? formatCurrency(selectedEntity.creditLimit) : 'Sin límite configurado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Saldo Actual</Label>
                    <p className={`text-lg font-semibold ${selectedEntity.currentBalance && Number(selectedEntity.currentBalance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {selectedEntity.currentBalance ? formatCurrency(Number(selectedEntity.currentBalance)) : '$0.00'}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </OwnerShell>
  );
}
