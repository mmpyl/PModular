'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function PlatformLoginPage() {
  const { platformLogin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await platformLogin({ email, password });
      router.replace('/platform');
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page platform-login-page">
      <span className="eyebrow">PModular · plataforma</span>
      <h1>Acceso global</h1>
      <p>Administra organizaciones y cuentas de negocio.</p>
      <form onSubmit={submit}>
        <label>
          Email de plataforma
          <input
            required
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@plataforma.com"
          />
        </label>
        <label>
          Contraseña
          <input
            required
            minLength={8}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Contraseña"
          />
        </label>
        {error && <p className="error-message" role="alert">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Validando...' : 'Entrar a plataforma'}
        </button>
        <Link href="/login">Acceso de usuario de negocio</Link>
      </form>
    </main>
  );
}