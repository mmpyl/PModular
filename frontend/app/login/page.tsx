'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await login({ email, password });
    router.push('/dashboard');
  };

  return (
    <main>
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit}>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@empresa.com" />
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña" />
        <button type="submit">Entrar</button>
      </form>
    </main>
  );
}
