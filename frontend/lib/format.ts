/**
 * Fase 3 - tarea 3.3: formateo centralizado.
 *
 * Reemplaza los `Intl.NumberFormat('es-MX', ... USD)` y `${x.toFixed(2)}`
 * esparcidos por las páginas. La moneda/locale/timezone provienen de la
 * configuración de la organización (ver useMoney en features/organization).
 *
 * Nota: el negocio es peruano — defaults es-PE / PEN (no es-MX / USD).
 */

export const DEFAULT_LOCALE = 'es-PE';
export const DEFAULT_CURRENCY = 'PEN';
export const DEFAULT_TIMEZONE = 'America/Lima';

export type MoneyConfig = {
  locale?: string;
  currency?: string;
  timezone?: string;
};

const moneyCache = new Map<string, Intl.NumberFormat>();

export function formatMoney(
  amount: number | string | null | undefined,
  config: MoneyConfig = {},
): string {
  const locale = config.locale || DEFAULT_LOCALE;
  const currency = config.currency || DEFAULT_CURRENCY;
  const key = `${locale}|${currency}`;
  let fmt = moneyCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, { style: 'currency', currency });
    moneyCache.set(key, fmt);
  }
  const value = typeof amount === 'string' ? Number(amount) : amount;
  return fmt.format(Number.isFinite(value as number) ? (value as number) : 0);
}

export function formatDate(
  date: Date | string | number | null | undefined,
  config: MoneyConfig = {},
): string {
  const d = date instanceof Date ? date : date == null ? null : new Date(date);
  if (!d || Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(config.locale || DEFAULT_LOCALE, {
    dateStyle: 'medium',
    timeZone: config.timezone || DEFAULT_TIMEZONE,
  }).format(d);
}

export function formatDateTime(
  date: Date | string | number | null | undefined,
  config: MoneyConfig = {},
): string {
  const d = date instanceof Date ? date : date == null ? null : new Date(date);
  if (!d || Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(config.locale || DEFAULT_LOCALE, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: config.timezone || DEFAULT_TIMEZONE,
  }).format(d);
}

export function formatNumber(value: number | string | null | undefined, locale?: string): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n as number)) return '0';
  return new Intl.NumberFormat(locale || DEFAULT_LOCALE).format(n as number);
}
