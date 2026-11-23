import type { ReactNode } from 'react';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { ArrowDownIcon, ArrowUpIcon, CalendarIcon, ReceiptIcon, WalletIcon } from '@/components/ui/Icons';
import type { Summary } from '@/lib/analytics';
import { formatCurrency, formatPercent } from '@/lib/format';

function Card({
  label,
  value,
  footer,
  icon,
  accent,
}: {
  label: string;
  value: ReactNode;
  footer: ReactNode;
  icon: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 shadow-sm sm:p-5 ${
        accent
          ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-indigo-600/20'
          : 'card'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-xs font-medium sm:text-sm ${accent ? 'text-indigo-100' : 'text-slate-500'}`}>{label}</p>
        <div className="hidden sm:block">{icon}</div>
      </div>
      <p className="mt-2 truncate text-xl font-bold tracking-tight tabular-nums sm:text-2xl">{value}</p>
      <div className={`mt-1.5 text-xs ${accent ? 'text-indigo-100' : 'text-slate-500'}`}>{footer}</div>
    </div>
  );
}

export function SummaryCards({ summary, currency }: { summary: Summary; currency: string }) {
  const change = summary.monthChange;
  const up = change !== null && change > 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <Card
        accent
        label="Total spending"
        value={formatCurrency(summary.total, currency)}
        footer={`${summary.count} ${summary.count === 1 ? 'expense' : 'expenses'} recorded`}
        icon={
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
            <WalletIcon size={18} />
          </span>
        }
      />
      <Card
        label="This month"
        value={formatCurrency(summary.thisMonth, currency)}
        footer={
          change === null ? (
            <span>No spending last month</span>
          ) : (
            <span className="inline-flex flex-wrap items-center gap-1">
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold ${
                  up ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {up ? <ArrowUpIcon size={12} strokeWidth={2.5} /> : <ArrowDownIcon size={12} strokeWidth={2.5} />}
                {formatPercent(Math.abs(change))}
              </span>
              vs last month
            </span>
          )
        }
        icon={
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <CalendarIcon size={18} />
          </span>
        }
      />
      <Card
        label="Top category"
        value={summary.topCategory ? summary.topCategory.category : '—'}
        footer={
          summary.topCategory
            ? `${formatCurrency(summary.topCategory.total, currency)} · ${formatPercent(summary.topCategory.share)} of ${
                summary.thisMonthCount ? 'this month' : 'total'
              }`
            : 'No data yet'
        }
        icon={summary.topCategory ? <CategoryIcon category={summary.topCategory.category} size="sm" /> : null}
      />
      <Card
        label="Average expense"
        value={formatCurrency(summary.average, currency)}
        footer={`${formatCurrency(summary.dailyAverageThisMonth, currency)}/day this month`}
        icon={
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ReceiptIcon size={18} />
          </span>
        }
      />
    </div>
  );
}
