import { formatMonth, monthKey } from './format';
import { CATEGORIES, type Category, type Expense } from './types';

/** Sums in integer cents to avoid floating point drift. */
export function sumAmounts(expenses: Expense[]): number {
  const cents = expenses.reduce((acc, e) => acc + Math.round(e.amount * 100), 0);
  return cents / 100;
}

export interface CategoryTotal {
  category: Category;
  total: number;
  count: number;
  share: number;
}

export function totalsByCategory(expenses: Expense[]): CategoryTotal[] {
  const grand = sumAmounts(expenses);
  return CATEGORIES.map((category) => {
    const items = expenses.filter((e) => e.category === category);
    const total = sumAmounts(items);
    return { category, total, count: items.length, share: grand > 0 ? total / grand : 0 };
  })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.total - a.total);
}

export interface MonthTotal {
  key: string;
  label: string;
  total: number;
  count: number;
}

export function monthlyTotals(expenses: Expense[], months = 6, ref = new Date()): MonthTotal[] {
  const result: MonthTotal[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const key = monthKey(new Date(ref.getFullYear(), ref.getMonth() - i, 1));
    const items = expenses.filter((e) => e.date.startsWith(key));
    result.push({ key, label: formatMonth(key), total: sumAmounts(items), count: items.length });
  }
  return result;
}

export function expensesInMonth(expenses: Expense[], key: string): Expense[] {
  return expenses.filter((e) => e.date.startsWith(key));
}

export interface Summary {
  total: number;
  count: number;
  average: number;
  thisMonth: number;
  thisMonthCount: number;
  lastMonth: number;
  /** Fractional change vs last month, or null when last month had no spending. */
  monthChange: number | null;
  dailyAverageThisMonth: number;
  topCategory: CategoryTotal | null;
}

export function getSummary(expenses: Expense[], ref = new Date()): Summary {
  const total = sumAmounts(expenses);
  const thisKey = monthKey(ref);
  const lastKey = monthKey(new Date(ref.getFullYear(), ref.getMonth() - 1, 1));
  const thisMonthItems = expensesInMonth(expenses, thisKey);
  const thisMonth = sumAmounts(thisMonthItems);
  const lastMonth = sumAmounts(expensesInMonth(expenses, lastKey));
  const top = totalsByCategory(thisMonthItems)[0] ?? totalsByCategory(expenses)[0] ?? null;

  return {
    total,
    count: expenses.length,
    average: expenses.length ? total / expenses.length : 0,
    thisMonth,
    thisMonthCount: thisMonthItems.length,
    lastMonth,
    monthChange: lastMonth > 0 ? (thisMonth - lastMonth) / lastMonth : null,
    dailyAverageThisMonth: thisMonth / ref.getDate(),
    topCategory: top,
  };
}

/** Rounds a max value up to a "nice" axis ceiling (1, 2, 2.5, 5, 10 × 10^n). */
export function niceCeiling(value: number): number {
  if (value <= 0) return 100;
  const exponent = Math.floor(Math.log10(value));
  const base = 10 ** exponent;
  const fraction = value / base;
  const nice = [1, 2, 2.5, 5, 10].find((n) => fraction <= n) ?? 10;
  return nice * base;
}
