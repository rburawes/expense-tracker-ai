import { addDays, toISODate, todayISO } from './format';
import type { Expense, ExpenseFilters, SortKey } from './types';

export const DEFAULT_FILTERS: ExpenseFilters = {
  search: '',
  category: 'All',
  startDate: '',
  endDate: '',
};

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date-desc', label: 'Newest first' },
  { value: 'date-asc', label: 'Oldest first' },
  { value: 'amount-desc', label: 'Highest amount' },
  { value: 'amount-asc', label: 'Lowest amount' },
];

export function filterExpenses(expenses: Expense[], filters: ExpenseFilters): Expense[] {
  const query = filters.search.trim().toLowerCase();
  return expenses.filter((e) => {
    if (filters.category !== 'All' && e.category !== filters.category) return false;
    if (filters.startDate && e.date < filters.startDate) return false;
    if (filters.endDate && e.date > filters.endDate) return false;
    if (query) {
      const haystack = `${e.description} ${e.category} ${e.amount.toFixed(2)}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function sortExpenses(expenses: Expense[], sort: SortKey): Expense[] {
  const sorted = [...expenses];
  sorted.sort((a, b) => {
    let diff = 0;
    switch (sort) {
      case 'date-desc':
        diff = b.date.localeCompare(a.date);
        break;
      case 'date-asc':
        diff = a.date.localeCompare(b.date);
        break;
      case 'amount-desc':
        diff = b.amount - a.amount;
        break;
      case 'amount-asc':
        diff = a.amount - b.amount;
        break;
    }
    return diff || b.createdAt.localeCompare(a.createdAt);
  });
  return sorted;
}

export function hasActiveFilters(filters: ExpenseFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.category !== 'All' ||
    filters.startDate !== '' ||
    filters.endDate !== ''
  );
}

export type QuickRange = 'this-month' | 'last-month' | 'last-30' | 'this-year';

export const QUICK_RANGES: { value: QuickRange; label: string }[] = [
  { value: 'this-month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
  { value: 'last-30', label: 'Last 30 days' },
  { value: 'this-year', label: 'This year' },
];

export function getQuickRange(
  range: QuickRange,
  ref = new Date(),
): Pick<ExpenseFilters, 'startDate' | 'endDate'> {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const today = toISODate(ref);
  switch (range) {
    case 'this-month':
      return { startDate: toISODate(new Date(y, m, 1)), endDate: today };
    case 'last-month':
      return { startDate: toISODate(new Date(y, m - 1, 1)), endDate: toISODate(new Date(y, m, 0)) };
    case 'last-30':
      return { startDate: addDays(todayISO(), -29), endDate: today };
    case 'this-year':
      return { startDate: toISODate(new Date(y, 0, 1)), endDate: today };
  }
}
