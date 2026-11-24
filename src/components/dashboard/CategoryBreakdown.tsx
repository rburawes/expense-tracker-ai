'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CategoryGlyph } from '@/components/ui/CategoryIcon';
import { totalsByCategory, sumAmounts, expensesInMonth } from '@/lib/analytics';
import { CATEGORY_META } from '@/lib/categories';
import { formatCurrency, formatPercent, monthKey } from '@/lib/format';
import type { Category, Expense } from '@/lib/types';

type Scope = 'month' | 'all';

const RADIUS = 62;
const STROKE = 18;
const CIRC = 2 * Math.PI * RADIUS;

export function CategoryBreakdown({ expenses, currency }: { expenses: Expense[]; currency: string }) {
  const [scope, setScope] = useState<Scope>('month');
  const [hovered, setHovered] = useState<Category | null>(null);

  const scoped = useMemo(
    () => (scope === 'month' ? expensesInMonth(expenses, monthKey(new Date())) : expenses),
    [expenses, scope],
  );
  const totals = useMemo(() => totalsByCategory(scoped), [scoped]);
  const grand = sumAmounts(scoped);
  const focus = totals.find((t) => t.category === hovered);

  const gap = totals.length > 1 ? 3 : 0;
  const segments = totals.map((t, i) => {
    const length = Math.max(t.share * CIRC - gap, 0.5);
    // Each segment starts where the previous ones end.
    const offset = totals.slice(0, i).reduce((acc, prev) => acc + prev.share * CIRC, 0);
    return { ...t, length, offset };
  });

  return (
    <section className="card flex h-full flex-col p-4 sm:p-6" aria-labelledby="category-title">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id="category-title" className="text-base font-semibold text-slate-900">
            Spending by category
          </h2>
          <p className="text-sm text-slate-500">{scope === 'month' ? 'This month' : 'All time'}</p>
        </div>
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium" role="tablist">
          {(['month', 'all'] as Scope[]).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={scope === s}
              onClick={() => setScope(s)}
              className={`rounded-md px-2.5 py-1 transition ${
                scope === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {s === 'month' ? 'Month' : 'All time'}
            </button>
          ))}
        </div>
      </div>

      {totals.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <div className="mb-3 h-28 w-28 rounded-full border-[14px] border-slate-100" aria-hidden="true" />
          <p className="text-sm text-slate-500">
            {scope === 'month' ? 'No expenses this month yet.' : 'No expenses yet.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center gap-6 sm:flex-row lg:flex-col">
          <div className="relative h-40 w-40 shrink-0">
            <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" role="img" aria-label="Category breakdown chart">
              <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="#f1f5f9" strokeWidth={STROKE} />
              {segments.map((s) => (
                <circle
                  key={s.category}
                  cx="80"
                  cy="80"
                  r={RADIUS}
                  fill="none"
                  stroke={CATEGORY_META[s.category].color}
                  strokeWidth={hovered === s.category ? STROKE + 4 : STROKE}
                  strokeDasharray={`${s.length} ${CIRC - s.length}`}
                  strokeDashoffset={-s.offset}
                  strokeLinecap="butt"
                  className="cursor-pointer transition-all duration-200"
                  opacity={hovered && hovered !== s.category ? 0.35 : 1}
                  onMouseEnter={() => setHovered(s.category)}
                  onMouseLeave={() => setHovered(null)}
                />
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-medium text-slate-500">{focus ? focus.category : 'Total'}</span>
              <span className="text-base font-bold tabular-nums text-slate-900">
                {formatCurrency(focus ? focus.total : grand, currency, { compact: (focus ? focus.total : grand) >= 100000 })}
              </span>
              {focus && <span className="text-[11px] text-slate-500">{formatPercent(focus.share, 1)}</span>}
            </div>
          </div>

          <ul className="w-full min-w-0 flex-1 space-y-1" role="list">
            {totals.map((t) => (
              <li key={t.category}>
                <Link
                  href={`/expenses?category=${encodeURIComponent(t.category)}`}
                  onMouseEnter={() => setHovered(t.category)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(t.category)}
                  onBlur={() => setHovered(null)}
                  className={`block rounded-lg px-2 py-1.5 transition ${hovered === t.category ? 'bg-slate-50' : ''}`}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span style={{ color: CATEGORY_META[t.category].color }}>
                      <CategoryGlyph category={t.category} size={16} />
                    </span>
                    <span className="flex-1 truncate font-medium text-slate-700">{t.category}</span>
                    <span className="tabular-nums font-semibold text-slate-900">{formatCurrency(t.total, currency)}</span>
                    <span className="w-10 text-right text-xs tabular-nums text-slate-400">{formatPercent(t.share)}</span>
                  </div>
                  <div className="ml-6 mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${t.share * 100}%`, backgroundColor: CATEGORY_META[t.category].color }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
