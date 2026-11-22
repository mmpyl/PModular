'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';
import { loginSchema, type LoginFormData } from '@/features/schemas/login-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const session = await login({ email, password });
      router.replace(session.organizationId ? '/dashboard' : '/select-organization');
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setSubmitError(caughtError.message || 'No se pudo iniciar sesión. Verifica tus credenciales.');
      } else {
        setSubmitError('No se pudo iniciar sesión. Verifica tus credenciales.');
      }
    }
  };

  return (
    <main className="auth-page">
      <span className="eyebrow">PModular</span>
      <h1>Iniciar sesión</h1>
      <p>Bienvenido de nuevo. Ingresa tus credenciales para continuar.</p>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@empresa.com"
          />
        </label>
        <label>
          Contraseña
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Contraseña"
          />
        </label>
        {error && <p className="error-message" role="alert">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Validando...' : 'Entrar'}
        </button>
        <Link href="/platform/login">Acceso de propietario global</Link>
      </form>
    </main>
  );
}
