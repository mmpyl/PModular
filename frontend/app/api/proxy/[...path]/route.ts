import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/lib/backend';
import { AUTH_COOKIE, verifyToken } from '@/lib/session-server';

/**
 * Proxy autenticado (tarea 2.3)
 *
 * Reenvía cualquier petición del cliente al backend NestJS añadiendo el
 * `Authorization: Bearer <token>` tomado de la cookie httpOnly. El navegador
 * nunca manipula el token; el único camino autenticado es este proxy.
 *
 * Seguridad:
 * - Si no hay cookie o la firma no valida -> 401 inmediato (no se reenvía).
 * - El header Authorization del cliente se IGNORA siempre.
 */
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

async function handler(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!token || !payload) {
    return NextResponse.json(
      { statusCode: 401, message: 'No autenticado: inicia sesión de nuevo' },
      { status: 401 },
    );
  }

  const segments = request.nextUrl.pathname.replace(/^\/api\/proxy\//, '');
  const targetUrl = `${API_URL}/${segments}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase()) && key.toLowerCase() !== 'authorization' && key.toLowerCase() !== 'cookie') {
      headers.set(key, value);
    }
  });
  // El Bearer lo añade SIEMPRE el proxy desde la cookie httpOnly
  headers.set('Authorization', `Bearer ${token}`);

  const hasBody = !['GET', 'HEAD'].includes(request.method);
  let backendRes: Response;
  try {
    backendRes = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { statusCode: 502, message: 'No se pudo contactar al servidor' },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  backendRes.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  if (backendRes.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const body = await backendRes.arrayBuffer();
  return new NextResponse(body, { status: backendRes.status, headers: responseHeaders });
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
