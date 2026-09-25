import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

/**
 * Middleware para proteger rutas a nivel de servidor
 * Se ejecuta antes de renderizar cualquier página
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Defensa en profundidad: el API proxy/route handlers nunca se protegen aquí
  // (el matcher ya excluye /api, pero esto evita sorpresas si cambia el config)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Landing pública: la raíz siempre es accesible sin sesión
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/register', '/platform/login'];
  
  // Rutas que requieren autenticación pero NO organización seleccionada
  const authWithoutOrgRoutes = ['/select-organization', '/create-organization', '/onboarding'];

  // Si la ruta es pública y hay token, redirigir al dashboard apropiado
  if (publicRoutes.includes(pathname)) {
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const platformRole = decoded.platformRole;
        
        // Si tiene rol de plataforma, ir al dashboard de plataforma
        if (platformRole && ['PLATFORM_ADMIN', 'SUPPORT'].includes(platformRole)) {
          return NextResponse.redirect(new URL('/platform/dashboard', request.url));
        }
        // Si no, ir al dashboard normal o select-organization
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch {
        // Token inválido, permitir acceso a login
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  // Proteger todas las rutas de plataforma
  if (pathname.startsWith('/platform')) {
    if (!token) {
      return NextResponse.redirect(new URL('/platform/login', request.url));
    }
    
    try {
      const decoded: any = jwtDecode(token);
      const platformRole = decoded.platformRole;
      
      // Verificar que tenga rol de plataforma válido
      if (!platformRole || !['PLATFORM_ADMIN', 'SUPPORT'].includes(platformRole)) {
        // No tiene permisos de plataforma, redirigir a dashboard normal
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      // Token inválido, redirigir a login de plataforma
      return NextResponse.redirect(new URL('/platform/login', request.url));
    }
    
    return NextResponse.next();
  }

  // Proteger rutas que requieren autenticación general
  if (!authWithoutOrgRoutes.includes(pathname)) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    try {
      // Validar que el token no esté expirado
      const decoded: any = jwtDecode(token);
      const now = Date.now() / 1000;
      
      if (decoded.exp && decoded.exp < now) {
        // Token expirado, limpiar cookie y redirigir a login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth_token');
        return response;
      }
    } catch {
      // Token inválido, redirigir a login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  // Verificar selección de organización para rutas que la requieren
  if (!authWithoutOrgRoutes.includes(pathname) && !pathname.startsWith('/platform')) {
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const organizationId = decoded.organizationId;
        
        // Si no tiene organización seleccionada y la ruta no es de las excepciones
        if (!organizationId && !authWithoutOrgRoutes.includes(pathname)) {
          return NextResponse.redirect(new URL('/select-organization', request.url));
        }
      } catch {
        // Error decodificando, dejar que el cliente lo maneje
      }
    }
  }

  return NextResponse.next();
}

// Configurar en qué rutas se ejecuta el middleware
export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - api (route handlers: /api/auth/cookie, etc. deben ser públicos)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (robots.txt, sitemap.xml, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
