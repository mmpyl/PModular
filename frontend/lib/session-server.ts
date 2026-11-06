import type { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Helpers de servidor para la cookie de sesión (Fase 2 - BFF).
 * El JWT vive ÚNICAMENTE aquí, en una cookie httpOnly: nunca se expone al navegador.
 */
export const AUTH_COOKIE = 'auth_token';

export type SessionPayload = {
  sub: string;
  email: string;
  name?: string | null;
  organizationId?: string;
  orgRole?: string;
  platformRole?: string | null;
  exp?: number;
  iat?: number;
};

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET no está configurado en el frontend (debe coincidir con el secreto del backend)',
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Verifica la FIRMA del token con jose (HS256, tarea 2.4).
 * Un JWT forjado o expirado devuelve null — nunca se acepta solo por decodificarlo.
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ['HS256'] });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

/** Opciones de la cookie httpOnly (SameSite=lax, solo HTTPS en producción). */
export function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: maxAgeSeconds,
    path: '/',
  };
}

/**
 * Escribe la cookie httpOnly con maxAge derivado EXACTAMENTE del `exp` del JWT (tarea 2.1).
 * Si no se puede leer `exp`, cae a 1h (coincide con JWT_EXPIRES_IN por defecto del backend).
 */
export function setSessionCookie(response: NextResponse, token: string) {
  let maxAge = 60 * 60;
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as { exp?: number };
    if (typeof payload.exp === 'number') {
      maxAge = Math.max(payload.exp - Math.floor(Date.now() / 1000), 0);
    }
  } catch {
    // token no decodificable: usar fallback
  }
  response.cookies.set(AUTH_COOKIE, token, cookieOptions(maxAge));
}

/** Datos seguros de usuario desde el payload (sin token). */
export function userFromPayload(payload: SessionPayload) {
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name ?? null,
    platformRole: payload.platformRole ?? null,
  };
}
