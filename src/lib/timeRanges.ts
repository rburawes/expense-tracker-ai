import { toISODate } from './format';
import type { Expense } from './types';

/**
 * Shared time-range presets for the ranking pages (Top Categories, Top Vendors).
 *
 * Ranges are inclusive and end today, matching the quick ranges on the
 * Expenses page (`getQuickRange` in ./filters). "Last 3 months" is the
 * current calendar month plus the two before it.
 */
export const TIME_RANGES = [
  { value: 'all', label: 'All time' },
  { value: 'this-month', label: 'This month' },
  { value: 'last-3-months', label: 'Last 3 months' },
  { value: 'this-year', label: 'This year' },
] as const;

export type TimeRange = (typeof TIME_RANGES)[number]['value'];

export function isTimeRange(value: unknown): value is TimeRange {
  return typeof value === 'string' && TIME_RANGES.some((r) => r.value === value);
}

export function timeRangeLabel(range: TimeRange): string {
  return TIME_RANGES.find((r) => r.value === range)?.label ?? 'All time';
}

/** Inclusive YYYY-MM-DD bounds relative to `ref` (local time), or null for all time. */
export function rangeBounds(
  range: TimeRange,
  ref = new Date(),
): { startDate: string; endDate: string } | null {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const endDate = toISODate(ref);
  switch (range) {
    case 'this-month':
      return { startDate: toISODate(new Date(y, m, 1)), endDate };
    case 'last-3-months':
      return { startDate: toISODate(new Date(y, m - 2, 1)), endDate };
    case 'this-year':
      return { startDate: toISODate(new Date(y, 0, 1)), endDate };
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
  return expenses.filter((e) => e.date >= bounds.startDate && e.date <= bounds.endDate);
}
