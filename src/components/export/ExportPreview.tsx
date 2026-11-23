import { CategoryBadge } from '@/components/ui/CategoryIcon';
import { FilterIcon } from '@/components/ui/Icons';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Expense } from '@/lib/types';

const PREVIEW_LIMIT = 50;

export function ExportPreview({
  rows,
  currency,
  stale,
  emptyMessage,
}: {
  rows: Expense[];
  currency: string;
  /** True while the preview is catching up with the latest filter change. */
  stale: boolean;
  emptyMessage: string;
}) {
  const visible = rows.slice(0, PREVIEW_LIMIT);

  return (
    <section aria-label="Export preview" className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Preview</h3>
        {rows.length > PREVIEW_LIMIT && (
          <span className="text-xs text-slate-500">
            Showing first {PREVIEW_LIMIT} of {rows.length.toLocaleString()}
          </span>
        )}
      </div>
      <div
        className={`relative min-h-[14rem] flex-1 overflow-auto rounded-xl border border-slate-200 transition-opacity lg:max-h-[22rem] ${
          stale ? 'opacity-60' : ''
        }`}
      >
        {visible.length === 0 ? (
          <div className="flex h-full min-h-[14rem] flex-col items-center justify-center gap-2 p-6 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <FilterIcon size={18} />
            </span>
            <p className="text-sm font-medium text-slate-700">Nothing to export</p>
            <p className="max-w-xs text-xs text-slate-500">{emptyMessage}</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500 shadow-[0_1px_0_theme(colors.slate.200)]">
              <tr>
                <th scope="col" className="whitespace-nowrap px-3 py-2">Date</th>
                <th scope="col" className="px-3 py-2">Category</th>
                <th scope="col" className="px-3 py-2">Description</th>
                <th scope="col" className="px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-600">{formatDate(e.date)}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <CategoryBadge category={e.category} />
                  </td>
                  <td className="max-w-[14rem] truncate px-3 py-2 text-slate-700" title={e.description}>
                    {e.description || <span className="text-slate-400">—</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums text-slate-900">
                    {formatCurrency(e.amount, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
