'use client';

import { useState } from 'react';
import { niceCeiling, type MonthTotal } from '@/lib/analytics';
import { formatCurrency, formatMonth } from '@/lib/format';

export function MonthlyTrendChart({ data, currency }: { data: MonthTotal[]; currency: string }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceCeiling(Math.max(...data.map((d) => d.total), 0));
  const ticks = [1, 0.75, 0.5, 0.25, 0];
  const average = data.reduce((acc, d) => acc + d.total, 0) / (data.length || 1);
  const shown = active ?? data.length - 1;
  const current = data[shown];

  return (
    <section className="card h-full p-4 sm:p-6" aria-labelledby="monthly-trend-title">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 id="monthly-trend-title" className="text-base font-semibold text-slate-900">
            Monthly spending
          </h2>
          <p className="text-sm text-slate-500">Last {data.length} months</p>
          {average > 0 && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-block w-4 border-t-2 border-dotted border-amber-400" aria-hidden="true" />
              Average {formatCurrency(average, currency)}/mo
            </p>
          )}
        </div>
        {current && (
          <div className="text-right" aria-live="polite">
            <p className="text-xs font-medium text-slate-500">{formatMonth(current.key, 'long')}</p>
            <p className="text-lg font-bold tabular-nums text-slate-900">{formatCurrency(current.total, currency)}</p>
            <p className="text-xs text-slate-400">
              {current.count} {current.count === 1 ? 'expense' : 'expenses'}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {/* Y axis */}
        <div className="flex h-52 flex-col justify-between pb-6 lg:h-[19rem] text-right text-[11px] tabular-nums text-slate-400 sm:h-60">
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 leading-none first:translate-y-0 last:translate-y-0">
              {formatCurrency(max * t, currency, { compact: true })}
            </span>
          ))}
        </div>

        {/* Plot */}
        <div className="relative flex-1">
          <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between" aria-hidden="true">
            {ticks.map((t) => (
              <div key={t} className={`border-t ${t === 0 ? 'border-slate-200' : 'border-dashed border-slate-100'}`} />
            ))}
          </div>
          {average > 0 && (
            <div
              className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dotted border-amber-400/70"
              style={{ bottom: `calc(1.5rem + (100% - 1.5rem) * ${average / max})` }}
              aria-hidden="true"
            />
          )}

          <ul className="relative flex h-52 items-end gap-2 sm:h-60 sm:gap-4 lg:h-[19rem]" role="list">
            {data.map((d, i) => {
              const pct = max > 0 ? (d.total / max) * 100 : 0;
              const isCurrent = i === data.length - 1;
              const isActive = i === shown;
              return (
                <li key={d.key} className="flex h-full flex-1 flex-col items-center">
                  <button
                    type="button"
                    className="group flex w-full flex-1 items-end justify-center rounded-t-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    onClick={() => setActive(i)}
                    aria-label={`${formatMonth(d.key, 'long')}: ${formatCurrency(d.total, currency)}`}
                  >
                    <span
                      className={`block w-full max-w-[52px] origin-bottom animate-grow-up rounded-t-lg transition-colors ${
                        isActive
                          ? 'bg-indigo-600'
                          : isCurrent
                            ? 'bg-indigo-400 group-hover:bg-indigo-500'
                            : 'bg-indigo-200 group-hover:bg-indigo-300'
                      }`}
                      style={{ height: `${Math.max(pct, d.total > 0 ? 2 : 0)}%` }}
                    />
                  </button>
                  <span
                    className={`mt-2 h-4 text-xs ${isActive ? 'font-semibold text-slate-900' : 'text-slate-500'}`}
                  >
                    {d.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
