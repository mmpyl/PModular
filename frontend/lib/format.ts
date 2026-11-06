export function formatMoney(value: number | string, currency: string) {
  const amount = Number(value) || 0;
  try {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}