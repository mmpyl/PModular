import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/backend';
import { setSessionCookie } from '@/lib/session-server';

/**
 * POST /api/auth/platform-login  (BFF)
 * Intercambio a token de plataforma (PLATFORM_ADMIN/SUPPORT).
 * El login del navegador ya dejó el JWT en la cookie httpOnly; aquí se usa
 * internamente para llamar a /auth/platform/login. El cliente nunca ve tokens.
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Cuerpo de solicitud inválido' }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ message: 'Email y contraseña son requeridos' }, { status: 400 });
  }

  // Paso 1: login normal (server-side) para obtener un token base
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });
  const loginData = (await loginRes.json().catch(() => ({}))) as Record<string, unknown> & {
    accessToken?: string;
  };
  if (!loginRes.ok || !loginData.accessToken) {
    return NextResponse.json(
      { message: 'Credenciales inválidas' },
      { status: loginRes.ok ? 401 : loginRes.status },
    );
  }

  // Paso 2: intercambio a token de plataforma
  const platformRes = await fetch(`${API_URL}/auth/platform/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loginData.accessToken}` },
    cache: 'no-store',
  });
  const data = (await platformRes.json().catch(() => ({}))) as Record<string, unknown> & {
    accessToken?: string;
  };
  if (!platformRes.ok || !data.accessToken) {
    const raw = data.message;
    const message = Array.isArray(raw) ? raw.join(', ') : (raw as string | undefined);
    return NextResponse.json(
      { message: message ?? 'Acceso de plataforma denegado' },
      { status: platformRes.ok ? 403 : platformRes.status },
    );
  }

  const response = NextResponse.json({
    user: data.user ?? null,
    organizationId: data.organizationId ?? null,
    orgRole: data.orgRole ?? null,
    platformRole: data.platformRole ?? null,
    memberships: data.memberships ?? [],
  });
  setSessionCookie(response, data.accessToken);
  return response;
}
