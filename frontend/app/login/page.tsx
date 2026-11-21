'use client';

<<<<<<< HEAD
import { FormEvent, useState } from 'react';
import Link from 'next/link';
=======
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540
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
<<<<<<< HEAD
      const session = await login({ email, password });
      router.replace(session.organizationId ? '/dashboard' : '/select-organization');
=======
      // Un solo flujo: login() del contexto ya espera a persistSession antes de resolver
      await login(data);
      router.push('/dashboard');
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setSubmitError(caughtError.message || 'No se pudo iniciar sesión. Verifica tus credenciales.');
      } else {
        setSubmitError('No se pudo iniciar sesión. Verifica tus credenciales.');
      }
    }
  };

  return (
<<<<<<< HEAD
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
=======
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-sm font-medium text-muted-foreground">PModular</p>
          <CardTitle className="text-2xl font-bold">Iniciar sesión</CardTitle>
          <CardDescription>
            Bienvenido de nuevo. Ingresa tus credenciales para continuar.
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
>>>>>>> e206d198e942f03be69312c7a5e9542c210e8540
    </main>
  );
}
