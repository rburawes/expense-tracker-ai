import { describe, expect, it } from 'vitest';
import { budgetStreak, dailyLimitCents, isValidBudget, monthBudgetProgress } from './insights';
import type { Category, Expense } from './types';

let seq = 0;
function exp(date: string, amount: number, category: Category = 'Food'): Expense {
  seq += 1;
  return {
    id: `e${seq}`,
    date,
    amount,
    category,
    description: `x${seq}`,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

// 2026-11-25 (local time). November has 30 days, so a $300 budget = $10/day.
const REF = new Date(2026, 10, 25, 14, 0, 0);

describe('isValidBudget', () => {
  it('accepts positive amounts with up to two decimals', () => {
    expect(isValidBudget(300)).toBe(true);
    expect(isValidBudget(19.99)).toBe(true);
  });

  it('rejects zero, negatives, non-numbers and fractional cents', () => {
    for (const v of [0, -5, NaN, Infinity, '300', null, undefined, 1.234]) {
      expect(isValidBudget(v)).toBe(false);
    }
  });
});

describe('dailyLimitCents', () => {
  it('spreads the budget over the days of that month', () => {
    expect(dailyLimitCents(300, '2026-11-10')).toBe(1000); // 30 days
    expect(dailyLimitCents(280, '2026-02-10')).toBe(1000); // 28 days
    expect(dailyLimitCents(310, '2026-12-31')).toBe(1000); // 31 days
  });
});

describe('budgetStreak', () => {
  it('is 0 without a budget or without expenses', () => {
    expect(budgetStreak([exp('2026-11-20', 1)], null, REF)).toBe(0);
    expect(budgetStreak([], 300, REF)).toBe(0);
  });

  it('counts days from the first expense through today when never over', () => {
    // 2026-11-20 .. 2026-11-25 inclusive = 6 days; empty days count as under budget.
    expect(budgetStreak([exp('2026-11-20', 5), exp('2026-11-23', 10)], 300, REF)).toBe(6);
  });

  it('stops at the most recent day that went over the daily allowance', () => {
    const expenses = [exp('2026-11-01', 1), exp('2026-11-21', 6), exp('2026-11-21', 6), exp('2026-11-24', 9)];
    // 11-21 spent $12 > $10, so the streak is 11-22 .. 11-25.
    expect(budgetStreak(expenses, 300, REF)).toBe(4);
  });

  it('is 0 when today is already over', () => {
    expect(budgetStreak([exp('2026-11-01', 1), exp('2026-11-25', 10.01)], 300, REF)).toBe(0);
  });

  it('treats spending exactly at the allowance as within budget', () => {
    expect(budgetStreak([exp('2026-11-25', 10)], 300, REF)).toBe(1);
  });

  it('ignores future-dated expenses', () => {
    expect(budgetStreak([exp('2026-11-24', 1), exp('2026-11-26', 999)], 300, REF)).toBe(2);
    expect(budgetStreak([exp('2026-12-01', 1)], 300, REF)).toBe(0);
  });

  it('uses each month’s own allowance across a month boundary', () => {
    const ref = new Date(2026, 11, 2); // Dec 2; $310 budget = $10/day in Dec, $10.33/day in Nov.
    const expenses = [exp('2026-11-29', 1), exp('2026-11-30', 10.3), exp('2026-12-01', 10)];
    expect(budgetStreak(expenses, 310, ref)).toBe(4);
  });
});

describe('monthBudgetProgress', () => {
  it('is null without a budget', () => {
    expect(monthBudgetProgress([], null, REF)).toBeNull();
  });

  it('sums only the current month, cent-accurately', () => {
    const p = monthBudgetProgress(
      [exp('2026-11-02', 0.1), exp('2026-11-03', 0.2), exp('2026-10-31', 50)],
      300,
      REF,
    );
    expect(p).toEqual({ spent: 0.3, budget: 300, ratio: 0.001, remaining: 299.7 });
  });

  it('reports a ratio above 1 and negative remaining when over budget', () => {
    const p = monthBudgetProgress([exp('2026-11-02', 450)], 300, REF);
    expect(p?.ratio).toBe(1.5);
    expect(p?.remaining).toBe(-150);
  });
});
