'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';

export default function SelectOrganizationPage() {
  const { memberships, selectOrganization } = useAuth();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(memberships[0]?.organizationId ?? '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;
    setError('');
    setIsSubmitting(true);
    try {
      await selectOrganization(selectedId);
      router.replace('/dashboard');
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo seleccionar la organizacion');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProtectedRoute requireOrganization={false}>
      <main className="auth-page">
        <h1>Selecciona una organización</h1>
        <p>Elige el espacio de trabajo que quieres administrar.</p>
        <form onSubmit={handleSubmit}>
          <label>Organización<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} required>
            <option value="">Seleccionar...</option>
            {memberships.map((membership) => <option key={membership.organizationId} value={membership.organizationId}>{membership.organization.name} · {membership.role}</option>)}
          </select></label>
          {error && <p className="error-message" role="alert">{error}</p>}
          {!memberships.length && <p className="error-message">Tu usuario no tiene organizaciones asignadas.</p>}
          <button type="submit" disabled={isSubmitting || !memberships.length}>{isSubmitting ? 'Cargando...' : 'Continuar'}</button>
        </form>
      </main>
    </ProtectedRoute>
  );
}