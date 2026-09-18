import { NextRequest, NextResponse } from 'next/server';

/**
 * Route Handler para establecer cookie httpOnly con el JWT
 * Se llama después del login exitoso para migrar de localStorage a cookies seguras
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, maxAge = 60 * 60 * 24 * 7 } = body; // Default: 7 días

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token es requerido y debe ser un string' },
        { status: 400 }
      );
    }

    // Crear respuesta exitosa
    const response = NextResponse.json({ success: true });

    // Establecer cookie httpOnly (no accesible desde JavaScript)
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: 'lax', // Protege contra CSRF pero permite navegación normal
      maxAge,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error al establecer cookie:', error);
    return NextResponse.json(
      { error: 'Error interno al establecer la sesión' },
      { status: 500 }
    );
  }
}

/**
 * Route Handler para obtener información del token actual (sin exponer el token completo)
 * Retorna datos decodificados del JWT para hidratación del contexto
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ token: null }, { status: 200 });
  }

  try {
    // Decodificar el payload del JWT (parte media del token)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    return NextResponse.json({
      token,
      user: {
        id: payload.sub || payload.id,
        email: payload.email,
        name: payload.name,
        platformRole: payload.platformRole,
      },
      organizationId: payload.organizationId,
      orgRole: payload.orgRole,
      platformRole: payload.platformRole,
      exp: payload.exp,
    });
  } catch (error) {
    console.error('Error al decodificar token:', error);
    return NextResponse.json(
      { error: 'Token inválido', token: null },
      { status: 401 }
    );
  }
}

/**
 * Route Handler para eliminar la cookie de autenticación
 * Se llama durante el logout
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });

  response.cookies.delete('auth_token');

  return response;
}
