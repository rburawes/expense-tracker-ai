import { describe, expect, it } from 'vitest';
import {
  UNKNOWN_VENDOR,
  cleanDescription,
  filterByVendorRange,
  getVendorRangeBounds,
  rankVendors,
  topVendors,
  vendorKey,
} from './topVendors';
import type { Category, Expense } from './types';

let seq = 0;
function exp(description: string, amount: number, date = '2026-11-10', category: Category = 'Food'): Expense {
  seq += 1;
  return {
    id: `e${seq}`,
    date,
    amount,
    category,
    description,
    createdAt: `2026-11-10T00:00:${String(seq % 60).padStart(2, '0')}.000Z`,
    updatedAt: `2026-11-10T00:00:${String(seq % 60).padStart(2, '0')}.000Z`,
  };
}

// Local-time reference date: Tuesday 24 Nov 2026.
const REF = new Date(2026, 10, 24);

describe('normalization', () => {
  it('trims and collapses whitespace', () => {
    expect(cleanDescription('  Corner   Cafe \t\n ')).toBe('Corner Cafe');
    expect(vendorKey('  CORNER   cafe ')).toBe('corner cafe');
  });

  it('treats empty and whitespace-only descriptions as the empty key', () => {
    expect(vendorKey('')).toBe('');
    expect(vendorKey('   \t ')).toBe('');
  });
});

describe('rankVendors grouping', () => {
  it('groups case-insensitively and ignores extra whitespace', () => {
    const result = rankVendors([exp('Coffee', 3), exp('  coffee ', 4), exp('COFFEE', 5), exp('Coffee  shop', 6)]);
    expect(result).toHaveLength(2);
    const coffee = result.find((v) => v.key === 'coffee');
    expect(coffee?.count).toBe(3);
    expect(coffee?.total).toBe(12);
    expect(result.find((v) => v.key === 'coffee shop')?.name).toBe('Coffee shop');
  });

  it('displays the most common original casing', () => {
    const result = rankVendors([exp('netflix', 10), exp('Netflix', 10), exp('Netflix ', 10), exp('NETFLIX', 10)]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Netflix');
  });

  it('breaks casing ties deterministically regardless of input order', () => {
    const a = rankVendors([exp('uber', 1), exp('Uber', 1)]);
    const b = rankVendors([exp('Uber', 1), exp('uber', 1)]);
    expect(a[0].name).toBe(b[0].name);
    expect(a[0].name).toBe('Uber'); // 'U' < 'u' in code-unit order
  });

  it('groups empty descriptions under Unknown', () => {
    const result = rankVendors([exp('', 5), exp('   ', 7), exp('Bakery', 1)]);
    const unknown = result.find((v) => v.key === '');
    expect(unknown?.name).toBe(UNKNOWN_VENDOR);
    expect(unknown?.count).toBe(2);
    expect(unknown?.total).toBe(12);
  });
});

describe('rankVendors ranking and metrics', () => {
  it('orders vendors by total spend, highest first', () => {
    const result = rankVendors([
      exp('Small', 5),
      exp('Big', 100),
      exp('Medium', 20),
      exp('Medium', 30),
    ]);
    expect(result.map((v) => v.name)).toEqual(['Big', 'Medium', 'Small']);
  });

  it('breaks total ties by transaction count, then name', () => {
    const result = rankVendors([exp('Zed', 10), exp('Alpha', 10), exp('Multi', 5), exp('Multi', 5)]);
    expect(result.map((v) => v.name)).toEqual(['Multi', 'Alpha', 'Zed']);
  });

  it('computes shares of the total that sum to 1', () => {
    const result = rankVendors([exp('A', 75), exp('B', 20), exp('C', 5)]);
    expect(result.map((v) => v.share)).toEqual([0.75, 0.2, 0.05]);
    expect(result.reduce((s, v) => s + v.share, 0)).toBeCloseTo(1, 10);
  });

  it('sums in integer cents (no floating point drift)', () => {
    const result = rankVendors([exp('Coffee', 0.1), exp('Coffee', 0.2), exp('Coffee', 0.7)]);
    expect(result[0].total).toBe(1);
    const many = rankVendors(Array.from({ length: 10 }, () => exp('Gum', 0.1)));
    expect(many[0].total).toBe(1);
    expect(0.1 + 0.2).not.toBe(0.3); // sanity: naive float sum would drift
    expect(rankVendors([exp('X', 0.1), exp('X', 0.2)])[0].total).toBe(0.3);
  });

  it('picks the category with the highest spend as the main category', () => {
    const result = rankVendors([
      exp('Target', 10, '2026-11-01', 'Food'),
      exp('Target', 15, '2026-11-02', 'Food'),
      exp('Target', 40, '2026-11-03', 'Shopping'),
    ]);
    expect(result[0].mainCategory).toBe('Shopping');
  });

  it('resolves main-category ties by category order', () => {
    const result = rankVendors([exp('Mix', 10, '2026-11-01', 'Other'), exp('Mix', 10, '2026-11-01', 'Bills')]);
    expect(result[0].mainCategory).toBe('Bills');
  });

  it('reports the most recent purchase date', () => {
    const result = rankVendors([
      exp('Gym', 30, '2026-09-01'),
      exp('Gym', 30, '2026-11-15'),
      exp('Gym', 30, '2026-10-01'),
    ]);
    expect(result[0].lastDate).toBe('2026-11-15');
  });

  it('returns an empty list for empty input', () => {
    expect(rankVendors([])).toEqual([]);
    expect(topVendors([], 'this-month', REF)).toEqual([]);
  });

  it('reports zero shares when the total is zero', () => {
    const result = rankVendors([exp('Free', 0)]);
    expect(result[0].share).toBe(0);
    expect(result[0].total).toBe(0);
  });
});

describe('time ranges', () => {
  it('returns null bounds for all time', () => {
    expect(getVendorRangeBounds('all', REF)).toBeNull();
  });

  it('computes inclusive bounds ending today', () => {
    expect(getVendorRangeBounds('this-month', REF)).toEqual({ startDate: '2026-11-01', endDate: '2026-11-24' });
    expect(getVendorRangeBounds('last-3-months', REF)).toEqual({ startDate: '2026-09-01', endDate: '2026-11-24' });
    expect(getVendorRangeBounds('this-year', REF)).toEqual({ startDate: '2026-01-01', endDate: '2026-11-24' });
  });

  it('handles last 3 months across a year boundary', () => {
    expect(getVendorRangeBounds('last-3-months', new Date(2026, 0, 15))).toEqual({
      startDate: '2025-11-01',
      endDate: '2026-01-15',
    });
  });

  it('includes boundary dates and excludes dates just outside', () => {
    const items = [
      exp('Before', 1, '2026-10-31'),
      exp('Start', 1, '2026-11-01'),
      exp('End', 1, '2026-11-24'),
      exp('After', 1, '2026-11-25'),
    ];
    expect(filterByVendorRange(items, 'this-month', REF).map((e) => e.description)).toEqual(['Start', 'End']);
    expect(filterByVendorRange(items, 'all', REF)).toHaveLength(4);

    const yearItems = [exp('Old', 1, '2025-12-31'), exp('New', 1, '2026-01-01')];
    expect(filterByVendorRange(yearItems, 'this-year', REF).map((e) => e.description)).toEqual(['New']);

    const q = [exp('Out', 1, '2026-08-31'), exp('In', 1, '2026-09-01')];
    expect(filterByVendorRange(q, 'last-3-months', REF).map((e) => e.description)).toEqual(['In']);
  });

  it('filters before ranking so shares reflect the selected range', () => {
    const items = [exp('Old big', 1000, '2025-06-01'), exp('A', 30, '2026-11-02'), exp('B', 10, '2026-11-03')];
    const result = topVendors(items, 'this-month', REF);
    expect(result.map((v) => v.name)).toEqual(['A', 'B']);
    expect(result[0].share).toBe(0.75);
  });
});
