import { describe, expect, it } from 'vitest';
import { filterByRange, isTimeRange, rangeBounds, timeRangeLabel, TIME_RANGES } from './timeRanges';
import type { Expense } from './types';

let seq = 0;
function exp(date: string): Expense {
  seq += 1;
  return {
    id: `e${seq}`,
    date,
    amount: 1,
    category: 'Food',
    description: date,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

// Local-time reference date: Tuesday 24 Nov 2026.
const REF = new Date(2026, 10, 24, 12, 0, 0);
const dates = (list: Expense[]) => list.map((e) => e.date);

describe('rangeBounds', () => {
  it('returns null for all time', () => {
    expect(rangeBounds('all', REF)).toBeNull();
  });

  it('computes inclusive bounds ending today', () => {
    expect(rangeBounds('this-month', REF)).toEqual({ startDate: '2026-11-01', endDate: '2026-11-24' });
    expect(rangeBounds('last-3-months', REF)).toEqual({ startDate: '2026-09-01', endDate: '2026-11-24' });
    expect(rangeBounds('this-year', REF)).toEqual({ startDate: '2026-01-01', endDate: '2026-11-24' });
  });

  it('handles last 3 months across a year boundary', () => {
    expect(rangeBounds('last-3-months', new Date(2026, 1, 15))).toEqual({
      startDate: '2025-12-01',
      endDate: '2026-02-15',
    });
  });

  it('works on the first and last day of the year', () => {
    expect(rangeBounds('this-month', new Date(2026, 0, 1))).toEqual({ startDate: '2026-01-01', endDate: '2026-01-01' });
    expect(rangeBounds('this-year', new Date(2026, 11, 31, 23, 59))).toEqual({
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
  });
});

describe('filterByRange', () => {
  const data = [
    exp('2025-12-31'),
    exp('2026-01-01'),
    exp('2026-08-31'),
    exp('2026-09-01'),
    exp('2026-10-31'),
    exp('2026-11-01'),
    exp('2026-11-24'),
    exp('2026-11-25'),
    exp('2027-01-01'),
  ];

  it('returns the input unchanged for all time', () => {
    expect(filterByRange(data, 'all', REF)).toBe(data);
  });

  it('includes the month start and today, excluding the day before and future days', () => {
    expect(dates(filterByRange(data, 'this-month', REF))).toEqual(['2026-11-01', '2026-11-24']);
  });

  it('includes the first day two months back and excludes the day before', () => {
    expect(dates(filterByRange(data, 'last-3-months', REF))).toEqual([
      '2026-09-01',
      '2026-10-31',
      '2026-11-01',
      '2026-11-24',
    ]);
  });

  it('includes Jan 1 for this year and excludes last year and future dates', () => {
    expect(dates(filterByRange(data, 'this-year', REF))).toEqual([
      '2026-01-01',
      '2026-08-31',
      '2026-09-01',
      '2026-10-31',
      '2026-11-01',
      '2026-11-24',
    ]);
  });

  it('returns an empty list for empty input', () => {
    for (const { value } of TIME_RANGES) {
      expect(filterByRange([], value, REF)).toEqual([]);
    }
  });
});

describe('isTimeRange / timeRangeLabel', () => {
  it('accepts known ranges and rejects anything else', () => {
    expect(TIME_RANGES.every((r) => isTimeRange(r.value))).toBe(true);
    expect(isTimeRange('week')).toBe(false);
    expect(isTimeRange(undefined)).toBe(false);
  });

  it('returns the display label', () => {
    expect(timeRangeLabel('last-3-months')).toBe('Last 3 months');
    expect(timeRangeLabel('all')).toBe('All time');
  });
});
