'use client';

import { useMemo, useState } from 'react';
import { useExpenseDialog } from '@/components/providers/ExpenseDialogProvider';
import { useExpenses } from '@/components/providers/ExpenseProvider';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { CalendarIcon, PlusIcon, StoreIcon } from '@/components/ui/Icons';
import { PageHeader } from '@/components/ui/PageHeader';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { StorageErrorBanner } from '@/components/ui/StorageErrorBanner';
import { sumAmounts } from '@/lib/analytics';
import { CATEGORY_META } from '@/lib/categories';
import { formatCurrency, formatDate, formatPercent } from '@/lib/format';
import {
  DEFAULT_VENDOR_LIMIT,
  VENDOR_RANGES,
  filterByVendorRange,
  rankVendors,
  type VendorRange,
  type VendorTotal,
} from '@/lib/topVendors';

function ShareBar({ vendor }: { vendor: VendorTotal }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
      <div
        className="h-full rounded-full"
        style={{ width: `${vendor.share * 100}%`, backgroundColor: CATEGORY_META[vendor.mainCategory].color }}
      />
    </div>
  );
}

export function TopVendorsView() {
  const { expenses, isLoaded, currency } = useExpenses();
  const { openCreate } = useExpenseDialog();
  const [range, setRange] = useState<VendorRange>('all');
  const [showAll, setShowAll] = useState(false);

  const scoped = useMemo(() => filterByVendorRange(expenses, range), [expenses, range]);
  const vendors = useMemo(() => rankVendors(scoped), [scoped]);
  const grand = useMemo(() => sumAmounts(scoped), [scoped]);
  const shown = showAll ? vendors : vendors.slice(0, DEFAULT_VENDOR_LIMIT);
  const rangeLabel = VENDOR_RANGES.find((r) => r.value === range)?.label ?? '';

  const rangePicker = (
    <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium" role="tablist" aria-label="Time range">
      {VENDOR_RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          role="tab"
          aria-selected={range === r.value}
          onClick={() => setRange(r.value)}
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
        title="Top Vendors"
        description="Where your money goes, grouped by expense description."
        actions={isLoaded && expenses.length > 0 ? rangePicker : undefined}
      />
      <StorageErrorBanner />

      {!isLoaded ? (
        <ListSkeleton />
      ) : expenses.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<StoreIcon size={28} />}
            title="No vendors yet"
            description="Vendors are derived from your expense descriptions. Add an expense to see where you spend the most."
          >
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <PlusIcon size={18} strokeWidth={2.25} />
              Add expense
            </button>
          </EmptyState>
        </div>
      ) : vendors.length === 0 ? (
        <div className="card">
          <EmptyState
            compact
            icon={<CalendarIcon size={26} />}
            title="No expenses in this period"
            description={`You have no expenses for "${rangeLabel.toLowerCase()}". Try a wider time range.`}
          >
            <button type="button" className="btn btn-secondary" onClick={() => setRange('all')}>
              Show all time
            </button>
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 px-1 text-sm" aria-live="polite">
            <p className="text-slate-500">
              <span className="font-semibold text-slate-900">{vendors.length}</span>{' '}
              {vendors.length === 1 ? 'vendor' : 'vendors'} · {rangeLabel}
            </p>
            <p className="text-slate-500">
              Total{' '}
              <span className="text-base font-bold tabular-nums text-slate-900">{formatCurrency(grand, currency)}</span>
            </p>
          </div>

          <div className="card overflow-hidden">
            {/* Mobile list */}
            <ol className="divide-y divide-slate-100 md:hidden" role="list">
              {shown.map((v, i) => (
                <li key={v.key} className="flex items-center gap-3 p-4">
                  <span className="w-5 shrink-0 text-center text-sm font-semibold tabular-nums text-slate-400">{i + 1}</span>
                  <CategoryIcon category={v.mainCategory} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={`truncate text-sm font-medium ${v.key ? 'text-slate-900' : 'italic text-slate-500'}`}>
                        {v.name}
                      </p>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                        {formatCurrency(v.total, currency)}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {v.count} {v.count === 1 ? 'purchase' : 'purchases'} · last {formatDate(v.lastDate)} ·{' '}
                      {formatPercent(v.share, 1)}
                    </p>
                    <div className="mt-2">
                      <ShareBar vendor={v} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            {/* Desktop table */}
            <table className="hidden w-full md:table">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-5 py-3 text-center">#</th>
                  <th scope="col" className="w-full px-5 py-3">Vendor</th>
                  <th scope="col" className="px-5 py-3 text-right">Total</th>
                  <th scope="col" className="px-5 py-3 text-right">Purchases</th>
                  <th scope="col" className="min-w-40 px-5 py-3">Share</th>
                  <th scope="col" className="whitespace-nowrap px-5 py-3">Last purchase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((v, i) => (
                  <tr key={v.key} className="text-sm">
                    <td className="px-5 py-3 text-center font-semibold tabular-nums text-slate-400">{i + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <CategoryIcon category={v.mainCategory} size="sm" />
                        <div className="min-w-0">
                          <p className={`truncate font-medium ${v.key ? 'text-slate-900' : 'italic text-slate-500'}`}>
                            {v.name}
                          </p>
                          <p className="text-xs text-slate-500">{v.mainCategory}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums text-slate-900">
                      {formatCurrency(v.total, currency)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-600">{v.count}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <ShareBar vendor={v} />
                        </div>
                        <span className="w-12 text-right text-xs tabular-nums text-slate-500">
                          {formatPercent(v.share, 1)}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600">{formatDate(v.lastDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {vendors.length > DEFAULT_VENDOR_LIMIT && (
              <div className="border-t border-slate-100 p-3 text-center">
                <button
                  type="button"
                  className="btn btn-ghost"
                  aria-expanded={showAll}
                  onClick={() => setShowAll((s) => !s)}
                >
                  {showAll ? `Show top ${DEFAULT_VENDOR_LIMIT}` : `Show all (${vendors.length} vendors)`}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
