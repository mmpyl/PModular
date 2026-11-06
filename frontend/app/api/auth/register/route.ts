import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/backend';
import { setSessionCookie } from '@/lib/session-server';

/**
 * POST /api/auth/register  (BFF)
 * Crea la cuenta en el backend y establece la cookie httpOnly de sesión.
 * La respuesta no incluye el token.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Cuerpo de solicitud inválido' }, { status: 400 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ message: 'No se pudo contactar al servidor' }, { status: 502 });
  }

  const data = (await backendRes.json().catch(() => ({}))) as Record<string, unknown> & {
    accessToken?: string;
  };

  if (!backendRes.ok || !data.accessToken) {
    const raw = data.message;
    const message = Array.isArray(raw) ? raw.join(', ') : (raw as string | undefined);
    return NextResponse.json(
      { message: message ?? 'No se pudo registrar' },
      { status: backendRes.ok ? 401 : backendRes.status },
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
