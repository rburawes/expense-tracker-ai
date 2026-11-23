'use client';

import { FilterIcon, SearchIcon, XIcon } from '@/components/ui/Icons';
import { DEFAULT_FILTERS, QUICK_RANGES, SORT_OPTIONS, getQuickRange, hasActiveFilters } from '@/lib/filters';
import { CATEGORIES, type Category, type ExpenseFilters, type SortKey } from '@/lib/types';

interface FilterBarProps {
  filters: ExpenseFilters;
  onChange: (filters: ExpenseFilters) => void;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
}

export function FilterBar({ filters, onChange, sort, onSortChange }: FilterBarProps) {
  const set = (patch: Partial<ExpenseFilters>) => onChange({ ...filters, ...patch });
  const invalidRange = Boolean(filters.startDate && filters.endDate && filters.startDate > filters.endDate);
  const activeQuick = QUICK_RANGES.find((r) => {
    const range = getQuickRange(r.value);
    return range.startDate === filters.startDate && range.endDate === filters.endDate;
  })?.value;

  return (
    <div className="card mb-4 space-y-4 p-4 sm:mb-6 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <label htmlFor="expense-search" className="sr-only">
            Search expenses
          </label>
          <SearchIcon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="expense-search"
            type="search"
            placeholder="Search description, category or amount…"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="input pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => set({ search: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Clear search"
            >
              <XIcon size={16} />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 lg:flex">
          <div>
            <label htmlFor="filter-category" className="sr-only">
              Category
            </label>
            <select
              id="filter-category"
              value={filters.category}
              onChange={(e) => set({ category: e.target.value as Category | 'All' })}
              className="input lg:w-44"
            >
              <option value="All">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sort" className="sr-only">
              Sort by
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SortKey)}
              className="input lg:w-44"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="grid flex-1 grid-cols-2 gap-3 sm:max-w-md">
          <div>
            <label htmlFor="filter-start" className="mb-1 block text-xs font-medium text-slate-500">
              From
            </label>
            <input
              id="filter-start"
              type="date"
              value={filters.startDate}
              max={filters.endDate || undefined}
              onChange={(e) => set({ startDate: e.target.value })}
              className={`input py-2 ${invalidRange ? 'input-error' : ''}`}
            />
          </div>
          <div>
            <label htmlFor="filter-end" className="mb-1 block text-xs font-medium text-slate-500">
              To
            </label>
            <input
              id="filter-end"
              type="date"
              value={filters.endDate}
              min={filters.startDate || undefined}
              onChange={(e) => set({ endDate: e.target.value })}
              className={`input py-2 ${invalidRange ? 'input-error' : ''}`}
            />
          </div>
        </div>
        <div className="-mx-1 flex flex-wrap items-center gap-1.5 px-1">
          {QUICK_RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() =>
                activeQuick === r.value
                  ? set({ startDate: '', endDate: '' })
                  : set(getQuickRange(r.value))
              }
              aria-pressed={activeQuick === r.value}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                activeQuick === r.value
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {r.label}
            </button>
          ))}
          {hasActiveFilters(filters) && (
            <button
              type="button"
              onClick={() => onChange(DEFAULT_FILTERS)}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
            >
              <FilterIcon size={14} />
              Clear filters
            </button>
          )}
        </div>
      </div>
      {invalidRange && (
        <p className="field-error" role="alert">
          The start date is after the end date, so no expenses can match.
        </p>
      )}
    </div>
  );
}
