'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useExpenseDialog } from '@/components/providers/ExpenseDialogProvider';
import { useExpenses } from '@/components/providers/ExpenseProvider';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { CalendarIcon, PlusIcon, TrophyIcon } from '@/components/ui/Icons';
import { PageHeader } from '@/components/ui/PageHeader';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { StorageErrorBanner } from '@/components/ui/StorageErrorBanner';
import { sumAmounts } from '@/lib/analytics';
import { CATEGORY_META } from '@/lib/categories';
import { formatCurrency, formatPercent } from '@/lib/format';
import { TIME_RANGES, filterByRange, rankCategories, type TimeRange } from '@/lib/topCategories';

export function TopCategoriesView() {
  const { expenses, isLoaded, currency } = useExpenses();
  const { openCreate } = useExpenseDialog();
  const [range, setRange] = useState<TimeRange>('all');

  const scoped = useMemo(() => filterByRange(expenses, range), [expenses, range]);
  const ranked = useMemo(() => rankCategories(scoped), [scoped]);
  const grand = useMemo(() => sumAmounts(scoped), [scoped]);
  const rangeLabel = TIME_RANGES.find((r) => r.value === range)?.label ?? 'All time';

  const selector = (
    <div className="flex flex-wrap rounded-lg bg-slate-100 p-0.5 text-xs font-medium" role="tablist" aria-label="Time range">
      {TIME_RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          role="tab"
          aria-selected={range === r.value}
          onClick={() => setRange(r.value)}
          disabled={!isLoaded}
          className={`rounded-md px-2.5 py-1.5 transition ${
            range === r.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <PageHeader
        title="Top categories"
        description="See which categories you spend the most on."
        actions={expenses.length > 0 || !isLoaded ? selector : undefined}
      />
      <StorageErrorBanner />

      {!isLoaded ? (
        <ListSkeleton rows={4} />
      ) : expenses.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<TrophyIcon size={28} />}
            title="No expenses yet"
            description="Add some expenses to see your categories ranked by total spend."
          >
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <PlusIcon size={18} strokeWidth={2.25} />
              Add expense
            </button>
          </EmptyState>
        </div>
      ) : ranked.length === 0 ? (
        <div className="card">
          <EmptyState
            compact
            icon={<CalendarIcon size={28} />}
            title="No expenses in this period"
            description={`You have no expenses for "${rangeLabel.toLowerCase()}". Try a wider time range.`}
          >
            <button type="button" className="btn btn-secondary" onClick={() => setRange('all')}>
              Show all time
            </button>
          </EmptyState>
        </div>
      ) : (
        <section className="card overflow-hidden" aria-labelledby="top-categories-title">
          <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6">
            <h2 id="top-categories-title" className="text-base font-semibold text-slate-900">
              {rangeLabel}
            </h2>
            <p className="text-sm text-slate-500">
              <span className="font-semibold tabular-nums text-slate-900">{formatCurrency(grand, currency)}</span>
              {' · '}
              {scoped.length} {scoped.length === 1 ? 'expense' : 'expenses'}
            </p>
          </div>
          <ol className="divide-y divide-slate-100" role="list">
            {ranked.map((c) => (
              <li key={c.category}>
                <Link
                  href={`/expenses?category=${encodeURIComponent(c.category)}`}
                  className="flex items-center gap-3 px-4 py-4 transition hover:bg-slate-50 sm:gap-4 sm:px-6"
                >
                  <span className="w-6 shrink-0 text-center text-sm font-bold tabular-nums text-slate-400">
                    #{c.rank}
                  </span>
                  <CategoryIcon category={c.category} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate font-medium text-slate-900">{c.category}</span>
                      <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                        {formatCurrency(c.total, currency)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${c.share * 100}%`, backgroundColor: CATEGORY_META[c.category].color }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right text-xs tabular-nums text-slate-500">
                        {formatPercent(c.share, 1)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {c.count} {c.count === 1 ? 'expense' : 'expenses'} · avg{' '}
                      <span className="tabular-nums">{formatCurrency(c.average, currency)}</span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}
