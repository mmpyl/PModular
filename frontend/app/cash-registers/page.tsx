'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCashRegisters,
  useCreateCashRegister,
  useOpenCashRegister,
  useCloseCashRegister,
  useAddCashRegisterMovement,
  useCashRegisterMovements,
  type CashRegisterStatus,
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

type CreateRegisterFormData = {
  name: string;
  description?: string;
};

type OpenRegisterFormData = {
  initialBalance: number;
};

type CloseRegisterFormData = {
  finalBalance: number;
};

type MovementFormData = {
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  reason: string;
};

export default function CashRegistersPage() {
  const { organizationId } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [selectedRegisterId, setSelectedRegisterId] = useState<string | undefined>(undefined);

  const { data: registers = [], isLoading, refetch } = useCashRegisters(organizationId ?? undefined);
  const createRegister = useCreateCashRegister(organizationId ?? undefined);
  const openRegister = useOpenCashRegister(organizationId ?? undefined);
  const closeRegister = useCloseCashRegister(organizationId ?? undefined);
  const addMovement = useAddCashRegisterMovement(organizationId ?? undefined);
  const { data: movements = [] } = useCashRegisterMovements(organizationId ?? undefined, selectedRegisterId);

  const selectedRegister = registers.find((r) => r.id === selectedRegisterId);

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
  } = useForm<CreateRegisterFormData>();

  const {
    register: registerOpen,
    handleSubmit: handleSubmitOpen,
    reset: resetOpen,
  } = useForm<OpenRegisterFormData>();

  const {
    register: registerClose,
    handleSubmit: handleSubmitClose,
    reset: resetClose,
  } = useForm<CloseRegisterFormData>();

  const {
    register: registerMovement,
    handleSubmit: handleSubmitMovement,
    reset: resetMovement,
  } = useForm<MovementFormData>();

  const onCreateSubmit = async (data: CreateRegisterFormData) => {
    await createRegister.mutateAsync(data);
    setCreateDialogOpen(false);
    resetCreate();
    refetch();
  };

  const onOpenSubmit = async (data: OpenRegisterFormData) => {
    if (!selectedRegisterId) return;
    await openRegister.mutateAsync({ registerId: selectedRegisterId, initialBalance: data.initialBalance });
    setOpenDialogOpen(false);
    resetOpen();
    refetch();
  };

  const onCloseSubmit = async (data: CloseRegisterFormData) => {
    if (!selectedRegisterId) return;
    await closeRegister.mutateAsync({ registerId: selectedRegisterId, finalBalance: data.finalBalance });
    setCloseDialogOpen(false);
    resetClose();
    refetch();
  };

  const onMovementSubmit = async (data: MovementFormData) => {
    if (!selectedRegisterId) return;
    await addMovement.mutateAsync({ registerId: selectedRegisterId, data });
    setMovementDialogOpen(false);
    resetMovement();
    refetch();
  };

  const getStatusBadgeVariant = (status: CashRegisterStatus) => {
    switch (status) {
      case 'OPEN':
        return 'default' as const;
      case 'ACTIVE':
        return 'secondary' as const;
      case 'CLOSED':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  const getStatusLabel = (status: CashRegisterStatus) => {
    switch (status) {
      case 'OPEN':
        return 'Abierta';
      case 'ACTIVE':
        return 'Activa';
      case 'CLOSED':
        return 'Cerrada';
      default:
        return status;
    }
  };

  return (
    <OwnerShell active="cash">
      <OwnerHeader eyebrow="Tesorería" title="Cajas registradoras" />

      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Configuración</p>
              <h2 className="text-2xl font-semibold leading-none tracking-tight">Cajas registradoras</h2>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Nueva caja</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear nueva caja</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitCreate(onCreateSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      {...registerCreate('name', { required: 'Requerido' })}
                      placeholder="Caja principal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descripción (opcional)</Label>
                    <Input
                      id="description"
                      {...registerCreate('description')}
                      placeholder="Ubicación o notas"
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
                    <Button type="submit" disabled={createRegister.isPending}>
                      {createRegister.isPending ? 'Guardando...' : 'Crear'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>

        {isLoading ? (
          <p className="muted">Cargando cajas...</p>
        ) : (
          <div className="space-y-2">
            {registers.map((register) => (
              <div className="list-row items-center" key={register.id}>
                <span className="flex-1">
                  <strong>{register.name}</strong>
                  <small className="block">{register.description || 'Sin descripción'}</small>
                </span>
                <div className="flex items-center gap-4">
                  <Badge variant={getStatusBadgeVariant(register.status)}>
                    {getStatusLabel(register.status)}
                  </Badge>
                  {register.currentBalance !== undefined && (
                    <span className="font-semibold">${Number(register.currentBalance).toFixed(2)}</span>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedRegisterId(register.id)}
                  >
                    Ver movimientos
                  </Button>
                  {register.status === 'CLOSED' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedRegisterId(register.id);
                        setOpenDialogOpen(true);
                      }}
                      disabled={openRegister.isPending}
                    >
                      Abrir
                    </Button>
                  )}
                  {register.status === 'OPEN' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedRegisterId(register.id);
                          setMovementDialogOpen(true);
                        }}
                        disabled={addMovement.isPending}
                      >
                        Movimiento
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedRegisterId(register.id);
                          setCloseDialogOpen(true);
                        }}
                        disabled={closeRegister.isPending}
                      >
                        Cerrar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!registers.length && !isLoading && (
          <p className="muted">No hay cajas configuradas.</p>
        )}
      </CardContent>
    </Card>

      {/* Dialog para abrir caja */}
      <Dialog open={openDialogOpen} onOpenChange={setOpenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir caja - {selectedRegister?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitOpen(onOpenSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="initialBalance">Saldo inicial</Label>
              <Input
                id="initialBalance"
                type="number"
                min="0"
                step="0.01"
                {...registerOpen('initialBalance', {
                  required: 'Requerido',
                  min: { value: 0, message: 'Mínimo 0' },
                })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={openRegister.isPending}>
                {openRegister.isPending ? 'Abriendo...' : 'Abrir'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para cerrar caja */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar caja - {selectedRegister?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitClose(onCloseSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="finalBalance">Saldo final</Label>
              <Input
                id="finalBalance"
                type="number"
                min="0"
                step="0.01"
                {...registerClose('finalBalance', {
                  required: 'Requerido',
                  min: { value: 0, message: 'Mínimo 0' },
                })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCloseDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={closeRegister.isPending}>
                {closeRegister.isPending ? 'Cerrando...' : 'Cerrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para movimiento */}
      <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar movimiento - {selectedRegister?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitMovement(onMovementSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                {...registerMovement('amount', {
                  required: 'Requerido',
                  min: { value: 0.01, message: 'Mínimo 0.01' },
                })}
              />
            </div>
            <div>
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                className="w-full px-3 py-2 border rounded-md"
                {...registerMovement('type', { required: 'Requerido' })}
              >
                <option value="INCOME">Ingreso</option>
                <option value="EXPENSE">Egreso</option>
              </select>
            </div>
            <div>
              <Label htmlFor="reason">Motivo</Label>
              <Input
                id="reason"
                {...registerMovement('reason', { required: 'Requerido' })}
                placeholder="Ej: Venta en efectivo, pago de servicios, etc."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setMovementDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={addMovement.isPending}>
                {addMovement.isPending ? 'Guardando...' : 'Registrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver movimientos */}
      <Dialog
        open={!!selectedRegisterId && movements.length >= 0}
        onOpenChange={(open) => {
          if (!open) setSelectedRegisterId(undefined);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Movimientos - {selectedRegister?.name}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="movements" className="w-full">
            <TabsList>
              <TabsTrigger value="movements">Movimientos</TabsTrigger>
            </TabsList>
            <TabsContent value="movements" className="space-y-2">
              {movements.length > 0 ? (
                movements.map((movement) => (
                  <div key={movement.id} className="flex justify-between items-center p-2 border-b">
                    <div>
                      <p className="font-medium">{movement.reason}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(movement.createdAt).toLocaleDateString('es-MX')} ·{' '}
                        {movement.createdBy?.name || 'Sistema'}
                      </p>
                    </div>
                    <Badge variant={movement.type === 'INCOME' ? 'default' : 'destructive'}>
                      {movement.type === 'INCOME' ? '+' : '-'}${Number(movement.amount).toFixed(2)}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="muted">No hay movimientos registrados.</p>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </OwnerShell>
  );
}