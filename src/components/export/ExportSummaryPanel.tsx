import { CATEGORY_META } from '@/lib/categories';
import type { ExportSummary } from '@/lib/export';
import { formatCurrency, formatDate } from '@/lib/format';

export function ExportSummaryPanel({
  summary,
  totalAvailable,
  currency,
}: {
  summary: ExportSummary;
  totalAvailable: number;
  currency: string;
}) {
  const span =
    summary.firstDate && summary.lastDate
      ? summary.firstDate === summary.lastDate
        ? formatDate(summary.firstDate)
        : `${formatDate(summary.firstDate)} – ${formatDate(summary.lastDate)}`
      : '—';

  return (
    <section aria-label="Export summary" className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <dl className="grid grid-cols-3 gap-3">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Records</dt>
          <dd className="mt-0.5 text-xl font-bold tabular-nums text-slate-900" aria-live="polite">
            {summary.count.toLocaleString()}
            <span className="ml-1 text-xs font-medium text-slate-400">of {totalAvailable.toLocaleString()}</span>
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total</dt>
          <dd className="mt-0.5 truncate text-xl font-bold tabular-nums text-slate-900">
            {formatCurrency(summary.total, currency)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Span</dt>
          <dd className="mt-1.5 truncate text-sm font-medium text-slate-700" title={span}>
            {span}
          </dd>
        </div>
      </dl>

      {summary.total > 0 && (
        <div className="mt-4">
          <div className="flex h-2 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
            {summary.byCategory.map((c) => (
              <div
                key={c.category}
                style={{ width: `${(c.total / summary.total) * 100}%`, backgroundColor: CATEGORY_META[c.category].color }}
                title={`${c.category}: ${formatCurrency(c.total, currency)}`}
              />
            ))}
          </div>
          <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
            {summary.byCategory.map((c) => (
              <li key={c.category} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: CATEGORY_META[c.category].color }}
                  aria-hidden="true"
                />
                {c.category}
                <span className="tabular-nums text-slate-400">{Math.round((c.total / summary.total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
