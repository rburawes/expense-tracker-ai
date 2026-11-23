import { CATEGORIES, type Category, type Expense } from '@/lib/types';
import type { ExportOptions, ExportSummary } from './types';

/** Expenses matching the date range and category selection, oldest first. */
export function selectExpenses(
  expenses: Expense[],
  options: Pick<ExportOptions, 'startDate' | 'endDate' | 'categories'>,
): Expense[] {
  const allowed = new Set<Category>(options.categories);
  return expenses
    .filter((e) => {
      if (!allowed.has(e.category)) return false;
      if (options.startDate && e.date < options.startDate) return false;
      if (options.endDate && e.date > options.endDate) return false;
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}

/** Count of expenses per category inside the date range (ignores category selection). */
export function countByCategoryInRange(
  expenses: Expense[],
  startDate: string,
  endDate: string,
): Record<Category, number> {
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
  for (const e of expenses) {
    if (startDate && e.date < startDate) continue;
    if (endDate && e.date > endDate) continue;
    counts[e.category] += 1;
  }
  return counts;
}

export function summarize(rows: Expense[]): ExportSummary {
  const map = new Map<Category, { count: number; total: number }>();
  let total = 0;
  for (const e of rows) {
    total += e.amount;
    const entry = map.get(e.category) ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += e.amount;
    map.set(e.category, entry);
  }
  // Rows are sorted oldest-first by selectExpenses, but don't rely on it.
  let firstDate: string | null = null;
  let lastDate: string | null = null;
  for (const e of rows) {
    if (firstDate === null || e.date < firstDate) firstDate = e.date;
    if (lastDate === null || e.date > lastDate) lastDate = e.date;
  }
  return {
    count: rows.length,
    total: roundCents(total),
    firstDate,
    lastDate,
    byCategory: CATEGORIES.filter((c) => map.has(c))
      .map((c) => ({ category: c, count: map.get(c)!.count, total: roundCents(map.get(c)!.total) }))
      .sort((a, b) => b.total - a.total),
  };
}

function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}

export type DateRangeError = 'start-after-end' | null;

export function validateDateRange(startDate: string, endDate: string): DateRangeError {
  if (startDate && endDate && startDate > endDate) return 'start-after-end';
  return null;
}
