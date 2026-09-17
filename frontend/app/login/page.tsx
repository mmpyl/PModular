'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';
import { useLoginMutation } from '@/features/hooks/use-login-mutation';
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
  const { persistSession } = useAuth();
  const router = useRouter();
  const loginMutation = useLoginMutation();

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

  const onSubmit = async (data: LoginFormData) => {
    try {
      const session = await loginMutation.mutateAsync(data);
      persistSession(session);
      
      // Routing condicional basado en el tipo de usuario
      if (session.platformRole && ['PLATFORM_ADMIN', 'SUPPORT'].includes(session.platformRole) && !session.organizationId) {
        // Usuario de plataforma sin organización → Panel de plataforma
        router.push('/platform/organizations');
      } else if (session.memberships && session.memberships.length > 1 && !session.organizationId) {
        // Múltiples membresías sin organización seleccionada → Selector
        router.push('/select-organization');
      } else if (session.organizationId) {
        // Usuario con organización → Dashboard normal
        router.push('/dashboard');
      } else {
        // Caso por defecto → Dashboard
        router.push('/dashboard');
      }
    } catch (caughtError) {
      // El error ya está manejado por react-query, pero podemos mostrarlo si es necesario
      if (caughtError instanceof ApiError) {
        // Podríamos agregar un toast o mensaje de error aquí
        console.error(caughtError.message);
      }
    }
  };

  return (
    <main className="auth-page flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <span className="eyebrow text-sm font-medium text-muted-foreground">PModular</span>
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
            {loginMutation.isError && (
              <p className="text-sm text-destructive" role="alert">
                No se pudo iniciar sesión. Verifica tus credenciales.
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting || loginMutation.isPending}>
              {isSubmitting || loginMutation.isPending ? 'Validando...' : 'Entrar'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
