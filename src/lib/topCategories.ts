import { totalsByCategory, type CategoryTotal } from './analytics';
import type { Expense } from './types';

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
