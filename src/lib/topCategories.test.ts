import { describe, expect, it } from 'vitest';
import { rankCategories } from './topCategories';
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
