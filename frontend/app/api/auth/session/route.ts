import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/backend';
import { AUTH_COOKIE, verifyToken } from '@/lib/session-server';

/**
 * GET /api/auth/session  (tarea 2.2)
 *
 * Devuelve la sesión SIN el token: se verifica la firma de la cookie httpOnly
 * y se enriquecen los datos con las membresías del backend (pasando el Bearer
 * internamente, server-to-server). El navegador nunca ve el JWT.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // Verificación de firma: un JWT forjado o expirado se rechaza aquí mismo
  const payload = await verifyToken(token);
  if (!payload) {
    const response = NextResponse.json({ authenticated: false }, { status: 401 });
    response.cookies.delete(AUTH_COOKIE);
    return response;
  }

  // Miembro de organización que seleccionó el usuario en este token
  const membership = payload.organizationId
    ? { organizationId: payload.organizationId, role: payload.orgRole ?? null }
    : null;

  // Enriquecer con memberships desde el backend (sin exponer el token en la respuesta)
  let memberships: unknown[] = [];
  try {
    const res = await fetch(`${API_URL}/auth/memberships`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) memberships = data;
    }
  } catch {
    // fallo de red: devolver la sesión con lo que da el propio JWT
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: { id: payload.sub, email: payload.email, name: payload.name ?? null },
      organizationId: payload.organizationId ?? null,
      orgRole: payload.orgRole ?? null,
      platformRole: payload.platformRole ?? null,
      membership,
      memberships,
      exp: payload.exp ?? null,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
