import { addDays, monthKey, parseISODate, toISODate } from './format';
import type { Expense } from './types';

/** Upper bound on a monthly budget, to keep input sane. */
export const MAX_MONTHLY_BUDGET = 1_000_000_000;

/** A usable monthly budget: a finite number above zero with at most two decimals. */
export function isValidBudget(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0 &&
    value <= MAX_MONTHLY_BUDGET &&
    Math.abs(Math.round(value * 100) - value * 100) < 1e-6
  );
}

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * The daily allowance, in cents, for a calendar date: the monthly budget spread
 * evenly over that month's days (so February days get a little more than May days).
 */
export function dailyLimitCents(monthlyBudget: number, iso: string): number {
  return Math.floor((Math.round(monthlyBudget * 100) / daysInMonth(parseISODate(iso))));
}

/**
 * Number of consecutive days, ending today, on which spending stayed at or under
 * the daily allowance. Days before the first recorded expense don't count (there
 * was nothing being tracked yet), so a brand-new user starts at 0 rather than
 * at an arbitrarily long streak. Expenses dated after `ref` are ignored.
 */
export function budgetStreak(expenses: Expense[], monthlyBudget: number | null, ref = new Date()): number {
  if (!isValidBudget(monthlyBudget)) return 0;
  const today = toISODate(ref);

  const spentByDay = new Map<string, number>();
  let earliest: string | null = null;
  for (const e of expenses) {
    if (e.date > today) continue;
    spentByDay.set(e.date, (spentByDay.get(e.date) ?? 0) + Math.round(e.amount * 100));
    if (earliest === null || e.date < earliest) earliest = e.date;
  }
  if (earliest === null) return 0;

  let streak = 0;
  for (let day = today; day >= earliest; day = addDays(day, -1)) {
    if ((spentByDay.get(day) ?? 0) > dailyLimitCents(monthlyBudget, day)) break;
    streak += 1;
  }
  return streak;
}

export interface BudgetProgress {
  spent: number;
  budget: number;
  /** spent / budget; may exceed 1 when over budget. */
  ratio: number;
  remaining: number;
}

/** This calendar month's spending against the monthly budget, or null without a budget. */
export function monthBudgetProgress(
  expenses: Expense[],
  monthlyBudget: number | null,
  ref = new Date(),
): BudgetProgress | null {
  if (!isValidBudget(monthlyBudget)) return null;
  const key = monthKey(ref);
  const spentCents = expenses
    .filter((e) => e.date.startsWith(key))
    .reduce((acc, e) => acc + Math.round(e.amount * 100), 0);
  const budgetCents = Math.round(monthlyBudget * 100);
  return {
    spent: spentCents / 100,
    budget: monthlyBudget,
    ratio: spentCents / budgetCents,
    remaining: (budgetCents - spentCents) / 100,
  };
}
