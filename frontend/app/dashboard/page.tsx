'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <main>
        <h1>Dashboard protegido</h1>
        <p>Usuario autenticado: {user?.email}</p>
        <button type="button" onClick={logout}>Cerrar sesión</button>
      </main>
    </ProtectedRoute>
  );
}
