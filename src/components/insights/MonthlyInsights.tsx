'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useExpenseDialog } from '@/components/providers/ExpenseDialogProvider';
import { useExpenses } from '@/components/providers/ExpenseProvider';
import { CategoryGlyph } from '@/components/ui/CategoryIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { FlameIcon, PieIcon, PlusIcon } from '@/components/ui/Icons';
import { PageHeader } from '@/components/ui/PageHeader';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { StorageErrorBanner } from '@/components/ui/StorageErrorBanner';
import { expensesInMonth, sumAmounts, type CategoryTotal } from '@/lib/analytics';
import { CATEGORY_META } from '@/lib/categories';
import { formatCurrency, formatMonth, formatPercent, monthKey } from '@/lib/format';
import { budgetStreak, monthBudgetProgress, type BudgetProgress } from '@/lib/insights';
import { rankCategories } from '@/lib/topCategories';

const RADIUS = 62;
const STROKE = 22;
const CIRC = 2 * Math.PI * RADIUS;

/** Monthly insights: this month's spending donut, the top 3 categories, and the budget streak. */
export function MonthlyInsights() {
  const { expenses, isLoaded, currency, monthlyBudget } = useExpenses();
  const { openCreate } = useExpenseDialog();

  // Computed on the client after load, so "today" is the viewer's local date.
  const key = monthKey(new Date());
  const thisMonth = useMemo(() => expensesInMonth(expenses, key), [expenses, key]);
  const ranked = useMemo(() => rankCategories(thisMonth), [thisMonth]);
  const total = useMemo(() => sumAmounts(thisMonth), [thisMonth]);
  const streak = useMemo(() => budgetStreak(expenses, monthlyBudget), [expenses, monthlyBudget]);
  const progress = useMemo(() => monthBudgetProgress(expenses, monthlyBudget), [expenses, monthlyBudget]);

  return (
    <>
      <PageHeader title="Monthly insights" description={isLoaded ? formatMonth(key, 'long') : undefined} />
      <StorageErrorBanner />

      {!isLoaded ? (
        <ListSkeleton rows={3} />
      ) : expenses.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<PieIcon size={28} />}
            title="No expenses yet"
            description="Add some expenses to see where your money goes each month."
          >
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <PlusIcon size={18} strokeWidth={2.25} />
              Add expense
            </button>
          </EmptyState>
        </div>
      ) : (
        <div className="mx-auto max-w-xl space-y-4 sm:space-y-6">
          <section className="card p-5 sm:p-8" aria-labelledby="insights-spending-title">
            <h2 id="insights-spending-title" className="sr-only">
              Spending this month
            </h2>
            <SpendingDonut ranked={ranked} total={total} currency={currency} />

            <h3 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">Top 3</h3>
            {ranked.length === 0 ? (
              <p className="text-sm text-slate-500">No expenses this month yet.</p>
            ) : (
              <ol className="space-y-2" role="list">
                {ranked.slice(0, 3).map((c) => (
                  <li key={c.category}>
                    <Link
                      href={`/expenses?category=${encodeURIComponent(c.category)}`}
                      className="flex items-center gap-3 rounded-lg border-l-4 py-2.5 pl-3 pr-2 transition hover:bg-slate-50"
                      style={{ borderLeftColor: CATEGORY_META[c.category].color }}
                    >
                      <span style={{ color: CATEGORY_META[c.category].color }}>
                        <CategoryGlyph category={c.category} size={20} />
                      </span>
                      <span className="flex-1 truncate font-medium text-slate-800">{c.category}</span>
                      <span className="text-xs tabular-nums text-slate-400">{formatPercent(c.share)}</span>
                      <span className="w-24 text-right font-semibold tabular-nums text-slate-900">
                        {formatCurrency(c.total, currency)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <BudgetStreakCard streak={streak} progress={progress} currency={currency} />
        </div>
      )}
    </>
  );
}

function SpendingDonut({ ranked, total, currency }: { ranked: CategoryTotal[]; total: number; currency: string }) {
  const gap = ranked.length > 1 ? 2 : 0;
  const segments = ranked.map((t, i) => ({
    ...t,
    length: Math.max(t.share * CIRC - gap, 0.5),
    // Each segment starts where the previous ones end.
    offset: ranked.slice(0, i).reduce((acc, prev) => acc + prev.share * CIRC, 0),
  }));
  const label = ranked.length
    ? `Spending this month: ${ranked.map((t) => `${t.category} ${formatPercent(t.share)}`).join(', ')}`
    : 'No spending this month';

  return (
    <div className="relative mx-auto h-52 w-52">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" role="img" aria-label={label}>
        <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="#f1f5f9" strokeWidth={STROKE} />
        {segments.map((s) => (
          <circle
            key={s.category}
            cx="80"
            cy="80"
            r={RADIUS}
            fill="none"
            stroke={CATEGORY_META[s.category].color}
            strokeWidth={STROKE}
            strokeDasharray={`${s.length} ${CIRC - s.length}`}
            strokeDashoffset={-s.offset}
          >
            <title>{`${s.category}: ${formatCurrency(s.total, currency)} (${formatPercent(s.share, 1)})`}</title>
          </circle>
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-medium text-slate-500">Spending</span>
        <span className="text-xl font-bold tabular-nums text-slate-900">
          {formatCurrency(total, currency, { compact: total >= 100000 })}
        </span>
      </div>
    </div>
  );
}

function BudgetStreakCard({
  streak,
  progress,
  currency,
}: {
  streak: number;
  progress: BudgetProgress | null;
  currency: string;
}) {
  return (
    <section
      className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-5 sm:p-6"
      aria-labelledby="budget-streak-title"
    >
      <div className="flex items-center gap-2">
        <span className="text-orange-500">
          <FlameIcon size={20} />
        </span>
        <h2 id="budget-streak-title" className="text-base font-semibold text-slate-900">
          Budget streak
        </h2>
      </div>

      {progress === null ? (
        <div className="mt-4 text-sm text-slate-600">
          <p>Set a monthly budget to start a streak of days spent within your daily allowance.</p>
          <Link href="/settings" className="btn btn-secondary btn-sm mt-4">
            Set a budget
          </Link>
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
          <p className="text-center sm:text-left">
            <span className="block text-5xl font-bold tabular-nums text-emerald-600">{streak}</span>
            <span className="text-sm font-medium text-slate-600">
              {streak === 1 ? 'day' : 'days'} within budget{streak > 0 ? '!' : ''}
            </span>
          </p>
          <BudgetMeter progress={progress} currency={currency} />
        </div>
      )}
    </section>
  );
}

function BudgetMeter({ progress, currency }: { progress: BudgetProgress; currency: string }) {
  const over = progress.ratio > 1;
  const pct = Math.min(progress.ratio, 1) * 100;
  return (
    <div className="w-full sm:w-48">
      <div
        className="h-4 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200"
        role="meter"
        aria-label="Monthly budget used"
        aria-valuemin={0}
        aria-valuemax={progress.budget}
        aria-valuenow={Math.min(progress.spent, progress.budget)}
        aria-valuetext={`${formatCurrency(progress.spent, currency)} of ${formatCurrency(progress.budget, currency)}`}
      >
        <div
          className={`h-full rounded-full ${over ? 'bg-rose-500' : 'bg-emerald-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs tabular-nums text-slate-500">
        {formatCurrency(progress.spent, currency)} of {formatCurrency(progress.budget, currency)}
        {' · '}
        {over ? (
          <span className="font-medium text-rose-600">{formatCurrency(-progress.remaining, currency)} over</span>
        ) : (
          <>{formatCurrency(progress.remaining, currency)} left</>
        )}
      </p>
    </div>
  );
}
