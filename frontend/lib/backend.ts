/**
 * URL interna del backend NestJS para código de servidor (BFF).
 * NEXT_PUBLIC_API_URL se mantiene solo como valor por defecto razonable.
 */
export const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
