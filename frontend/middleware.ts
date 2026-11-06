import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Middleware de rutas (Fase 2 - tarea 2.4)
 *
 * AHORA VERIFICA LA FIRMA del JWT (con `jose`, HS256 y el secreto compartido
 * con el backend) en lugar de solo decodificarlo como hacía con jwtDecode.
 * Un token forjado (firma inválida, algoritmo distinto o expirado) se rechaza:
 * se limpia la cookie y se redirige a login.
 *
 * Nota de arquitectura: mientras el backend firme con HS256, frontend y backend
 * deben compartir JWT_SECRET. El paso natural siguiente es migrar a RS256 + JWKS
 * para que el frontend solo necesite la clave pública.
 */
const AUTH_COOKIE = 'auth_token';

type SessionPayload = {
  sub?: string;
  email?: string;
  organizationId?: string;
  orgRole?: string;
  platformRole?: string | null;
  exp?: number;
};

async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  // Sin secreto no se puede verificar la firma: fail-closed (rechazar).
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch {
    // Firma inválida, algoritmo sospechoso o token expirado -> rechazado
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const rawToken = request.cookies.get(AUTH_COOKIE)?.value;
  const { pathname } = request.nextUrl;

  // Defensa en profundidad: el API proxy/route handlers nunca se protegen aquí
  // (el matcher ya excluye /api, pero esto evita sorpresas si cambia el config)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Verificación de firma: un JWT forjado equivale a "sin sesión"
  const decoded = await verifySession(rawToken);
  const hasValidSession = decoded !== null;

  const clearSession = (response: NextResponse) => {
    response.cookies.delete(AUTH_COOKIE);
    return response;
  };

  // Landing pública: la raíz siempre es accesible sin sesión
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/register', '/platform/login'];

  // Rutas que requieren autenticación pero NO organización seleccionada
  const authWithoutOrgRoutes = ['/select-organization', '/create-organization', '/onboarding'];

  // Si la ruta es pública y hay sesión válida, redirigir al dashboard apropiado
  if (publicRoutes.includes(pathname)) {
    if (hasValidSession && decoded) {
      const platformRole = decoded.platformRole;
      if (platformRole && ['PLATFORM_ADMIN', 'SUPPORT'].includes(platformRole)) {
        return NextResponse.redirect(new URL('/platform/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Sin sesión o token forjado: permitir acceso a login (y limpiar cookie sucia)
    return clearSession(NextResponse.next());
  }

  // Proteger todas las rutas de plataforma
  if (pathname.startsWith('/platform')) {
    if (!hasValidSession || !decoded) {
      return clearSession(NextResponse.redirect(new URL('/platform/login', request.url)));
    }

    const platformRole = decoded.platformRole;
    if (!platformRole || !['PLATFORM_ADMIN', 'SUPPORT'].includes(platformRole)) {
      // Autenticado pero sin rol de plataforma: fuera del área de plataforma
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  }

  // Proteger rutas que requieren autenticación general
  if (!authWithoutOrgRoutes.includes(pathname)) {
    if (!rawToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (!hasValidSession || !decoded) {
      // Token presente pero FORJADO o expirado: se rechaza y limpia
      return clearSession(NextResponse.redirect(new URL('/login', request.url)));
    }
  }

  // Verificar selección de organización para rutas que la requieren
  if (
    !authWithoutOrgRoutes.includes(pathname) &&
    !pathname.startsWith('/platform') &&
    hasValidSession &&
    decoded &&
    !decoded.organizationId
  ) {
    return NextResponse.redirect(new URL('/select-organization', request.url));
  }

  return NextResponse.next();
}

// Configurar en qué rutas se ejecuta el middleware
export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - api (route handlers BFF: /api/auth/*, /api/proxy/* deben ser públicos)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (robots.txt, sitemap.xml, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
