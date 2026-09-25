import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/backend';
import { setSessionCookie } from '@/lib/session-server';

/**
 * POST /api/auth/login  (BFF, tarea 2.1)
 *
 * Llama al backend con las credenciales, guarda el JWT en una cookie httpOnly
 * cuyo maxAge es exactamente el `exp` del token, y devuelve SOLO datos seguros:
 * user, rol y memberships. El token nunca viaja en el JSON de respuesta.
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

  let backendRes: Response;
  try {
    backendRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
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
      { message: message ?? 'Credenciales inválidas' },
      { status: backendRes.ok ? 401 : backendRes.status },
    );
  }

  // Respuesta SIN accessToken: solo user, rol y memberships (tarea 2.1)
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
