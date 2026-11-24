import { totalsByCategory, type CategoryTotal } from './analytics';
import { toISODate } from './format';
import type { Expense } from './types';

export const TIME_RANGES = [
  { value: 'all', label: 'All time' },
  { value: 'month', label: 'This month' },
  { value: '3months', label: 'Last 3 months' },
  { value: 'year', label: 'This year' },
] as const;

export type TimeRange = (typeof TIME_RANGES)[number]['value'];

export function isTimeRange(value: unknown): value is TimeRange {
  return typeof value === 'string' && TIME_RANGES.some((r) => r.value === value);
}

/**
 * Inclusive YYYY-MM-DD bounds for a range, relative to `ref` (local time),
 * or null for "all time". Periods cover whole calendar months/years, so
 * "Last 3 months" is the current month plus the two before it.
 */
export function rangeBounds(range: TimeRange, ref = new Date()): { start: string; end: string } | null {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  switch (range) {
    case 'month':
      return { start: toISODate(new Date(y, m, 1)), end: toISODate(new Date(y, m + 1, 0)) };
    case '3months':
      return { start: toISODate(new Date(y, m - 2, 1)), end: toISODate(new Date(y, m + 1, 0)) };
    case 'year':
      return { start: `${y}-01-01`, end: `${y}-12-31` };
    case 'all':
    default:
      return null;
  }
}

/** Expenses whose date falls within the range (bounds inclusive). */
export function filterByRange(expenses: Expense[], range: TimeRange, ref = new Date()): Expense[] {
  const bounds = rangeBounds(range, ref);
  if (!bounds) return expenses;
  // YYYY-MM-DD strings sort lexicographically in date order.
  return expenses.filter((e) => e.date >= bounds.start && e.date <= bounds.end);
}

export interface RankedCategory extends CategoryTotal {
  /** 1-based position, highest total first. */
  rank: number;
  /** Average amount per expense, rounded to the cent. */
  average: number;
}

/** Ranks categories by total spend (highest first); categories with no expenses are omitted. */
export function rankCategories(expenses: Expense[]): RankedCategory[] {
  return totalsByCategory(expenses).map((t, i) => ({
    ...t,
    rank: i + 1,
    average: Math.round((t.total * 100) / t.count) / 100,
  }));
}
