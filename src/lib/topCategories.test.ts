import { describe, expect, it } from 'vitest';
import { filterByRange, isTimeRange, rangeBounds, rankCategories, TIME_RANGES } from './topCategories';
import type { Category, Expense } from './types';

let seq = 0;
function exp(category: Category, amount: number, date = '2026-02-10'): Expense {
  seq += 1;
  return {
    id: `e${seq}`,
    date,
    amount,
    category,
    description: `${category} ${seq}`,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

// Mid-February 2026, local time. Feb 2026 has 28 days.
const REF = new Date(2026, 1, 15, 12, 0, 0);

describe('rankCategories', () => {
  it('returns an empty list for no expenses', () => {
    expect(rankCategories([])).toEqual([]);
  });

  it('ranks categories by total spend, highest first, with 1-based ranks', () => {
    const ranked = rankCategories([
      exp('Food', 10),
      exp('Bills', 100),
      exp('Food', 15),
      exp('Shopping', 50),
    ]);
    expect(ranked.map((r) => [r.rank, r.category, r.total])).toEqual([
      [1, 'Bills', 100],
      [2, 'Shopping', 50],
      [3, 'Food', 25],
    ]);
  });

  it('omits categories with no expenses', () => {
    const ranked = rankCategories([exp('Other', 5)]);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].category).toBe('Other');
  });

  it('breaks ties by the fixed category order', () => {
    const ranked = rankCategories([exp('Other', 20), exp('Food', 20)]);
    expect(ranked.map((r) => r.category)).toEqual(['Food', 'Other']);
  });

  it('counts expenses per category', () => {
    const ranked = rankCategories([exp('Food', 1), exp('Food', 2), exp('Food', 3), exp('Bills', 50)]);
    expect(ranked.find((r) => r.category === 'Food')?.count).toBe(3);
    expect(ranked.find((r) => r.category === 'Bills')?.count).toBe(1);
  });

  it('computes shares of the grand total that sum to 1', () => {
    const ranked = rankCategories([exp('Bills', 75), exp('Food', 20), exp('Other', 5)]);
    expect(ranked.map((r) => r.share)).toEqual([0.75, 0.2, 0.05]);
    expect(ranked.reduce((acc, r) => acc + r.share, 0)).toBeCloseTo(1, 10);
  });

  it('gives a single category a 100% share', () => {
    expect(rankCategories([exp('Food', 3), exp('Food', 4)])[0].share).toBe(1);
  });

  it('computes the average per expense, rounded to the cent', () => {
    const ranked = rankCategories([exp('Food', 10), exp('Food', 20), exp('Bills', 10), exp('Bills', 10), exp('Bills', 0.01)]);
    expect(ranked.find((r) => r.category === 'Food')?.average).toBe(15);
    // 20.01 / 3 = 6.67
    expect(ranked.find((r) => r.category === 'Bills')?.average).toBe(6.67);
  });

  it('sums amounts cent-accurately (no floating point drift)', () => {
    const ranked = rankCategories([exp('Food', 0.1), exp('Food', 0.2), exp('Shopping', 0.3)]);
    // 0.1 + 0.2 === 0.30000000000000004 in plain floats.
    expect(ranked.find((r) => r.category === 'Food')?.total).toBe(0.3);
    expect(ranked.find((r) => r.category === 'Shopping')?.total).toBe(0.3);
    expect(ranked.every((r) => r.share === 0.5)).toBe(true);

    const many = Array.from({ length: 10 }, () => exp('Bills', 19.99));
    const bills = rankCategories(many)[0];
    expect(bills.total).toBe(199.9);
    expect(bills.average).toBe(19.99);
  });
});

describe('rangeBounds', () => {
  it('returns null for all time', () => {
    expect(rangeBounds('all', REF)).toBeNull();
  });

  it('covers the whole current month', () => {
    expect(rangeBounds('month', REF)).toEqual({ start: '2026-02-01', end: '2026-02-28' });
  });

  it('handles leap-year February', () => {
    expect(rangeBounds('month', new Date(2028, 1, 3))).toEqual({ start: '2028-02-01', end: '2028-02-29' });
  });

  it('covers the current month plus the two before it, across a year boundary', () => {
    expect(rangeBounds('3months', REF)).toEqual({ start: '2025-12-01', end: '2026-02-28' });
  });

  it('covers the whole current year', () => {
    expect(rangeBounds('year', REF)).toEqual({ start: '2026-01-01', end: '2026-12-31' });
  });

  it('works on the first and last day of a month', () => {
    expect(rangeBounds('month', new Date(2026, 0, 1))).toEqual({ start: '2026-01-01', end: '2026-01-31' });
    expect(rangeBounds('month', new Date(2026, 11, 31, 23, 59))).toEqual({ start: '2026-12-01', end: '2026-12-31' });
  });
});

describe('filterByRange', () => {
  const data = [
    exp('Food', 1, '2025-11-30'),
    exp('Food', 2, '2025-12-01'),
    exp('Food', 3, '2025-12-31'),
    exp('Food', 4, '2026-01-01'),
    exp('Food', 5, '2026-01-31'),
    exp('Food', 6, '2026-02-01'),
    exp('Food', 7, '2026-02-28'),
    exp('Food', 8, '2026-03-01'),
    exp('Food', 9, '2026-12-31'),
    exp('Food', 10, '2027-01-01'),
  ];
  const amounts = (list: Expense[]) => list.map((e) => e.amount);

  it('returns everything for all time', () => {
    expect(filterByRange(data, 'all', REF)).toBe(data);
  });

  it('includes both month boundaries and excludes neighbouring days', () => {
    expect(amounts(filterByRange(data, 'month', REF))).toEqual([6, 7]);
  });

  it('includes the first day two months back and excludes the day before', () => {
    expect(amounts(filterByRange(data, '3months', REF))).toEqual([2, 3, 4, 5, 6, 7]);
  });

  it('includes Jan 1 and Dec 31 for this year and excludes other years', () => {
    expect(amounts(filterByRange(data, 'year', REF))).toEqual([4, 5, 6, 7, 8, 9]);
  });

  it('returns an empty list for empty input', () => {
    for (const { value } of TIME_RANGES) {
      expect(filterByRange([], value, REF)).toEqual([]);
    }
  });

  it('can be combined with ranking', () => {
    const mixed = [exp('Bills', 100, '2025-06-01'), exp('Food', 30, '2026-02-02'), exp('Shopping', 20, '2026-02-20')];
    expect(rankCategories(filterByRange(mixed, 'month', REF)).map((r) => r.category)).toEqual(['Food', 'Shopping']);
    expect(rankCategories(filterByRange(mixed, 'all', REF))[0].category).toBe('Bills');
  });
});

describe('isTimeRange', () => {
  it('accepts known ranges and rejects anything else', () => {
    expect(TIME_RANGES.every((r) => isTimeRange(r.value))).toBe(true);
    expect(isTimeRange('week')).toBe(false);
    expect(isTimeRange(undefined)).toBe(false);
  });
});
