'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register({ name, email, password });
      router.replace('/onboarding');
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'No se pudo crear la cuenta');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium text-muted-foreground">PModular</p>
          <h1 className="text-3xl font-bold tracking-tight">Crea tu cuenta</h1>
          <p className="text-muted-foreground">Después elegirás el tipo de negocio y sus módulos.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <Button type="submit" disabled={busy} className="w-full">{busy ? 'Creando...' : 'Crear cuenta'}</Button>
          <Link href="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors">Ya tengo una cuenta</Link>
        </form>
      </div>
    </main>
  );
}