import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/backend';
import { AUTH_COOKIE, setSessionCookie, verifyToken } from '@/lib/session-server';

/**
 * POST /api/auth/select-organization  (BFF)
 * Intercambia el token actual por uno con contexto de organización.
 * El Bearer viaja solo server-to-server; la respuesta no incluye el token.
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!token || !payload) {
    return NextResponse.json({ message: 'La sesión ha expirado' }, { status: 401 });
  }

  const { organizationId } = (await request.json().catch(() => ({}))) as { organizationId?: string };
  if (!organizationId) {
    return NextResponse.json({ message: 'organizationId es requerido' }, { status: 400 });
  }

  const backendRes = await fetch(`${API_URL}/auth/select-organization`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ organizationId }),
    cache: 'no-store',
  });

  const data = (await backendRes.json().catch(() => ({}))) as Record<string, unknown> & {
    accessToken?: string;
  };

  if (!backendRes.ok || !data.accessToken) {
    const raw = data.message;
    const message = Array.isArray(raw) ? raw.join(', ') : (raw as string | undefined);
    return NextResponse.json(
      { message: message ?? 'No se pudo seleccionar la organización' },
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
