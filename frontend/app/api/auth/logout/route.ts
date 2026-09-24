import { NextResponse } from 'next/server';
import { AUTH_COOKIE } from '@/lib/session-server';

/**
 * DELETE /api/auth/logout
 * Elimina la cookie httpOnly de sesión. No acepta ni devuelve tokens.
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}
