'use client';

<<<<<<< HEAD
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
=======
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
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
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540

export default function PlatformLoginPage() {
  const { platformLogin } = useAuth();
  const router = useRouter();
<<<<<<< HEAD
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
=======

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
      // Un solo flujo: platformLogin() del contexto ya espera a persistSession antes de resolver
      await platformLogin(data);
      router.push('/platform/dashboard');
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setSubmitError(caughtError.message || 'No se pudo iniciar sesión. Verifica tus credenciales y permisos de plataforma.');
      } else {
        setSubmitError('No se pudo iniciar sesión. Verifica tus credenciales y permisos de plataforma.');
      }
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-sm font-medium text-muted-foreground">Owen Panel</p>
          <CardTitle className="text-2xl font-bold">Acceso de Plataforma</CardTitle>
          <CardDescription>
            Ingresa tus credenciales de administrador para acceder al panel de plataforma.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="email@empresa.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Contraseña"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>
            {submitError && (
              <p className="text-sm text-destructive" role="alert">
                {submitError}
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Validando...' : 'Entrar'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540
