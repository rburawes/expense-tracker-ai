const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string, compact: boolean): Intl.NumberFormat {
  const key = `${currency}|${compact}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        ...(compact ? { notation: 'compact', maximumFractionDigits: 1 } : {}),
      });
    } catch {
      formatter = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        ...(compact ? { notation: 'compact', maximumFractionDigits: 1 } : {}),
      });
    }
    formatterCache.set(key, formatter);
  }
  return formatter;
}

export function formatCurrency(
  amount: number,
  currency: string,
  options: { compact?: boolean } = {},
): string {
  return getFormatter(currency, options.compact ?? false).format(amount);
}

export function getCurrencySymbol(currency: string): string {
  const part = getFormatter(currency, false)
    .formatToParts(0)
    .find((p) => p.type === 'currency');
  return part?.value ?? currency;
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat(undefined, {
    style: 'percent',
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/* ------------------------------------------------------------------ */
/* Dates — always treated as local calendar dates (YYYY-MM-DD).        */
/* ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = parseISODate(value);
  return !Number.isNaN(d.getTime()) && toISODate(d) === value;
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function formatDate(iso: string, style: 'medium' | 'short' | 'long' = 'medium'): string {
  const d = parseISODate(iso);
  if (style === 'short') return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (style === 'long')
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatMonth(key: string, style: 'short' | 'long' = 'short'): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: style === 'long' ? 'long' : 'short',
    ...(style === 'long' ? { year: 'numeric' } : {}),
  });
}

/** "Today", "Yesterday", or a medium date. */
export function formatRelativeDate(iso: string): string {
  const today = todayISO();
  if (iso === today) return 'Today';
  if (iso === addDays(today, -1)) return 'Yesterday';
  return formatDate(iso);
}
