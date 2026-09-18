'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { useAuth } from '@/contexts/AuthContext';
import {
  useMemberships,
  useUpdateMemberRole,
  useRemoveMember,
  useInviteMember,
  type MemberWithUser,
} from '@/features/hooks';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

type InviteFormData = {
  email: string;
  role: 'OWNER' | 'ADMIN' | 'VENDEDOR' | 'INVENTARIO' | 'CAJA';
};

export default function TeamPage() {
  const { token, organizationId, orgRole } = useAuth();
  const orgId = organizationId ?? undefined;
  const { data: members = [], isLoading, error } = useMemberships(orgId, token);
  const updateMemberRole = useUpdateMemberRole(orgId, token);
  const removeMember = useRemoveMember(orgId, token);
  const inviteMember = useInviteMember(orgId, token);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberWithUser | null>(null);

  const {
    register: registerInvite,
    handleSubmit: handleSubmitInvite,
    reset: resetInvite,
    formState: { errors: inviteErrors },
  } = useForm<InviteFormData>({
    defaultValues: { email: '', role: 'VENDEDOR' },
  });

  const onInviteSubmit = async (data: InviteFormData) => {
    try {
      await inviteMember.mutateAsync({ email: data.email, role: data.role });
      setInviteDialogOpen(false);
      resetInvite();
    } catch (err) {
      console.error('Error al invitar miembro:', err);
      alert(err instanceof Error ? err.message : 'Error al invitar miembro');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    await updateMemberRole.mutateAsync({ userId, role: newRole as 'OWNER' | 'ADMIN' | 'VENDEDOR' | 'INVENTARIO' | 'CAJA' });
  };

  const handleRemoveMember = async (userId: string) => {
    if (confirm('¿Estás seguro de remover este miembro del equipo?')) {
      await removeMember.mutateAsync(userId);
    }
  };

  const canManageTeam = orgRole === 'OWNER';

  return (
    <OwnerShell active="team">
      <OwnerHeader
        eyebrow="Equipo"
        title={canManageTeam ? 'Equipo y permisos' : 'Equipo'}
      />

      {canManageTeam && (
        <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
          <AlertDescription>
            Como propietario puedes administrar los accesos de esta organización.
          </AlertDescription>
        </Alert>
      )}
      {!canManageTeam && (
        <p className="text-gray-500 text-sm mb-4">
          Consulta los miembros y sus roles. Solo el propietario puede modificar permisos.
        </p>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-500 mb-1 block">Miembros</span>
              <h2>Usuarios de la organización</h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{members.length} miembros</Badge>
              {canManageTeam && (
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">Invitar miembro</Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invitar nuevo miembro</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitInvite(onInviteSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Correo electrónico</Label>
                      <input
                        id="email"
                        type="email"
                        className="w-full px-3 py-2 border rounded-md"
                        {...registerInvite('email', { required: 'El correo es requerido' })}
                      />
                      {inviteErrors.email && (
                        <p className="text-sm text-red-500">{inviteErrors.email.message}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="role">Rol</Label>
                      <select
                        id="role"
                        className="w-full px-3 py-2 border rounded-md"
                        {...registerInvite('role')}
                      >
                        <option value="ADMIN">Administrador</option>
                        <option value="VENDEDOR">Vendedor</option>
                        <option value="INVENTARIO">Inventario</option>
                        <option value="CAJA">Caja</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={inviteMember.isPending}>
                        {inviteMember.isPending ? 'Invitando...' : 'Invitar'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-gray-500 text-sm">Cargando miembros...</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-md">
                  <span className="flex-1">
                    <strong className="block">{member.user.name || member.user.email}</strong>
                    <small className="text-gray-500">{member.user.email}</small>
                  </span>
                  {canManageTeam ? (
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(value) => handleRoleChange(member.user.id, value)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OWNER">Propietario</SelectItem>
                          <SelectItem value="ADMIN">Administrador</SelectItem>
                          <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                          <SelectItem value="INVENTARIO">Inventario</SelectItem>
                          <SelectItem value="CAJA">Caja</SelectItem>
                        </SelectContent>
                      </Select>
                      {member.role !== 'OWNER' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveMember(member.user.id)}
                          disabled={removeMember.isPending}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Badge variant="secondary">{member.role}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          {!members.length && !isLoading && !error && (
            <p className="text-gray-500 text-sm">No hay miembros para mostrar.</p>
          )}
        </CardContent>
      </Card>
    </OwnerShell>
  );
}