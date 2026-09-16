'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { OwnerHeader, OwnerShell } from '@/components/OwnerShell';
import { useAuth } from '@/contexts/AuthContext';
import {
  useMemberships,
  useUpdateMemberRole,
  useRemoveMember,
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

type InviteFormData = {
  email: string;
  role: 'OWNER' | 'ADMIN' | 'VENDEDOR' | 'INVENTARIO' | 'CAJA';
};

export default function TeamPage() {
  const { token, organizationId, orgRole } = useAuth();
  const { data: members = [], isLoading, error } = useMemberships(organizationId);
  const updateMemberRole = useUpdateMemberRole(organizationId);
  const removeMember = useRemoveMember(organizationId);
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
    // TODO: Implementar invitación cuando el backend lo soporte
    console.log('Invitar miembro:', data);
    setInviteDialogOpen(false);
    resetInvite();
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

      {canManageTeam ? (
        <p className="success-message">
          Como propietario puedes administrar los accesos de esta organización.
        </p>
      ) : (
        <p className="muted">
          Consulta los miembros y sus roles. Solo el propietario puede modificar permisos.
        </p>
      )}

      {error && <p className="error-message">{error.message}</p>}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Miembros</span>
            <h2>Usuarios de la organización</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="role-badge">{members.length} miembros</span>
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
                      <Button type="submit">Invitar</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {isLoading ? (
          <p className="muted">Cargando miembros...</p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div className="list-row items-center" key={member.id}>
                <span className="flex-1">
                  <strong>{member.user.name || member.user.email}</strong>
                  <small className="block">{member.user.email}</small>
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
                  <span className="role-badge">{member.role}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {!members.length && !isLoading && !error && (
          <p className="muted">No hay miembros para mostrar.</p>
        )}
      </section>
    </OwnerShell>
  );
}