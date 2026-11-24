import { toISODate } from './format';
import { CATEGORIES, type Category, type Expense } from './types';

/*
 * Vendor derivation
 * -----------------
 * Expenses have no vendor field, so the vendor is derived from the free-text
 * `description` with a deliberately simple heuristic:
 *
 *   1. Trim and collapse runs of whitespace to a single space.
 *   2. Group case-insensitively (the lower-cased cleaned text is the key).
 *   3. Display the most common original casing within the group
 *      (ties go to the alphabetically first variant, so output is stable).
 *   4. Empty / whitespace-only descriptions are grouped under "Unknown".
 *
 * No fuzzy matching, punctuation stripping or store-number removal is done:
 * "Coffee" and "Coffee shop" are different vendors.
 */

export const UNKNOWN_VENDOR = 'Unknown';
export const DEFAULT_VENDOR_LIMIT = 10;

/** Trims and collapses internal whitespace. */
export function cleanDescription(description: string): string {
  return (description ?? '').trim().replace(/\s+/g, ' ');
}

/** Case-insensitive grouping key for a description ('' means Unknown). */
export function vendorKey(description: string): string {
  return cleanDescription(description).toLowerCase();
}

/* ------------------------------------------------------------------ */
/* Time ranges                                                          */
/* ------------------------------------------------------------------ */

export type VendorRange = 'all' | 'this-month' | 'last-3-months' | 'this-year';

export const VENDOR_RANGES: { value: VendorRange; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'this-month', label: 'This month' },
  { value: 'last-3-months', label: 'Last 3 months' },
  { value: 'this-year', label: 'This year' },
];

/**
 * Inclusive YYYY-MM-DD bounds for a range, or null for "all time".
 * Ranges end on `ref` (today), matching the quick ranges on the Expenses page.
 * "Last 3 months" is the current calendar month plus the two before it.
 */
export function getVendorRangeBounds(
  range: VendorRange,
  ref = new Date(),
): { startDate: string; endDate: string } | null {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const endDate = toISODate(ref);
  switch (range) {
    case 'all':
      return null;
    case 'this-month':
      return { startDate: toISODate(new Date(y, m, 1)), endDate };
    case 'last-3-months':
      return { startDate: toISODate(new Date(y, m - 2, 1)), endDate };
    case 'this-year':
      return { startDate: toISODate(new Date(y, 0, 1)), endDate };
  }
}

export function filterByVendorRange(expenses: Expense[], range: VendorRange, ref = new Date()): Expense[] {
  const bounds = getVendorRangeBounds(range, ref);
  if (!bounds) return expenses;
  return expenses.filter((e) => e.date >= bounds.startDate && e.date <= bounds.endDate);
}

/* ------------------------------------------------------------------ */
/* Ranking                                                              */
/* ------------------------------------------------------------------ */

export interface VendorTotal {
  /** Case-insensitive grouping key ('' for Unknown). */
  key: string;
  /** Display name: most common original casing, or "Unknown". */
  name: string;
  total: number;
  count: number;
  /** Fraction (0–1) of the total spend across all vendors in the input. */
  share: number;
  /** Most recent expense date (YYYY-MM-DD). */
  lastDate: string;
  /** Category with the highest spend for this vendor. */
  mainCategory: Category;
}

interface Bucket {
  cents: number;
  count: number;
  lastDate: string;
  variants: Map<string, number>;
  categoryCents: Map<Category, number>;
}

function pickName(variants: Map<string, number>): string {
  let best = '';
  let bestCount = -1;
  for (const [name, count] of variants) {
    if (count > bestCount || (count === bestCount && name < best)) {
      best = name;
      bestCount = count;
    }
  }
  return best;
}

function pickCategory(categoryCents: Map<Category, number>): Category {
  // Iterate in CATEGORIES order so ties resolve deterministically.
  let best: Category = 'Other';
  let bestCents = -1;
  for (const category of CATEGORIES) {
    const cents = categoryCents.get(category);
    if (cents !== undefined && cents > bestCents) {
      best = category;
      bestCents = cents;
    }
  }
  return best;
}

/**
 * Groups expenses by derived vendor and ranks them by total spend (highest
 * first; ties by transaction count, then name). Sums are done in integer cents.
 */
export function rankVendors(expenses: Expense[]): VendorTotal[] {
  const buckets = new Map<string, Bucket>();
  let grandCents = 0;

  for (const e of expenses) {
    const cleaned = cleanDescription(e.description);
    const key = cleaned.toLowerCase();
    const cents = Math.round(e.amount * 100);
    grandCents += cents;

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { cents: 0, count: 0, lastDate: e.date, variants: new Map(), categoryCents: new Map() };
      buckets.set(key, bucket);
    }
    bucket.cents += cents;
    bucket.count += 1;
    if (e.date > bucket.lastDate) bucket.lastDate = e.date;
    bucket.variants.set(cleaned, (bucket.variants.get(cleaned) ?? 0) + 1);
    bucket.categoryCents.set(e.category, (bucket.categoryCents.get(e.category) ?? 0) + cents);
  }

  const result: VendorTotal[] = [];
  for (const [key, b] of buckets) {
    result.push({
      key,
      name: key === '' ? UNKNOWN_VENDOR : pickName(b.variants),
      total: b.cents / 100,
      count: b.count,
      share: grandCents > 0 ? b.cents / grandCents : 0,
      lastDate: b.lastDate,
      mainCategory: pickCategory(b.categoryCents),
    });
  }

  return result.sort(
    (a, b) => b.total - a.total || b.count - a.count || a.name.localeCompare(b.name),
  );
}

/** Convenience: filter by range, then rank. */
export function topVendors(expenses: Expense[], range: VendorRange, ref = new Date()): VendorTotal[] {
  return rankVendors(filterByVendorRange(expenses, range, ref));
}
