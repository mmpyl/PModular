'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(''); setBusy(true); try { await register({ name, email, password }); router.replace('/onboarding'); } catch (e: unknown) { setError(e instanceof ApiError ? e.message : 'No se pudo crear la cuenta'); } finally { setBusy(false); } }
  return <main className="auth-page"><span className="eyebrow">PModular</span><h1>Crea tu cuenta</h1><p>Después elegirás el tipo de negocio y sus módulos.</p><form onSubmit={submit}><label>Nombre<input required value={name} onChange={(e) => setName(e.target.value)} /></label><label>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label><label>Contraseña<input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>{error && <p className="error-message">{error}</p>}<button disabled={busy}>{busy ? 'Creando...' : 'Crear cuenta'}</button><Link href="/login">Ya tengo una cuenta</Link></form></main>;
}