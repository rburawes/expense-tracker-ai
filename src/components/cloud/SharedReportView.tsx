'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertCircleIcon, ClockIcon, LinkIcon, ShieldIcon } from '@/components/ui/Icons';
import { Skeleton } from '@/components/ui/Skeleton';
import { CATEGORY_META } from '@/lib/categories';
import { decodeSnapshot, type SnapshotV1 } from '@/lib/cloud/share';
import { getTemplate } from '@/lib/cloud/templates';
import { formatCurrency, formatDate, formatMonth } from '@/lib/format';

type State = { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'expired'; at: number } | { kind: 'ok'; data: SnapshotV1 };

/** Read-only report rendered entirely from the URL fragment. */
export function SharedReportView() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    const read = () => {
      const token = new URLSearchParams(window.location.hash.slice(1)).get('d');
      if (!token) {
        setState({ kind: 'error', message: 'This link is missing its report data. Ask the sender for a new link.' });
        return;
      }
      decodeSnapshot(token)
        .then((data) => setState(data.x !== null && data.x < Date.now() ? { kind: 'expired', at: data.x } : { kind: 'ok', data }))
        .catch((e: Error) => setState({ kind: 'error', message: e.message || 'This link could not be opened.' }));
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  if (state.kind === 'loading') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (state.kind !== 'ok') {
    const expired = state.kind === 'expired';
    return (
      <div className="card mx-auto flex max-w-md flex-col items-center gap-3 p-8 text-center">
        <span className={`flex h-12 w-12 items-center justify-center rounded-full ${expired ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
          {expired ? <ClockIcon size={22} /> : <AlertCircleIcon size={22} />}
        </span>
        <h1 className="text-lg font-semibold text-slate-900">{expired ? 'This link has expired' : 'Link unavailable'}</h1>
        <p className="text-sm text-slate-500">
          {expired ? `It stopped working on ${new Date(state.at).toLocaleString()}. Ask the sender to share a fresh one.` : state.message}
        </p>
        <Link href="/" className="btn btn-secondary mt-2">
          Go to Spendwise
        </Link>
      </div>
    );
  }

  const d = state.data;
  const t = getTemplate(d.t);
  const maxMonth = Math.max(1, ...d.months.map(([, v]) => v));

  return (
    <article className="space-y-5">
      <header className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg ${t.accent.gradient}`}>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide">
          <LinkIcon size={12} /> Shared report · read-only
        </p>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{d.title}</h1>
        <p className="text-white/80">{d.period}</p>
        <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-white/70">Total spent</dt>
            <dd className="text-2xl font-bold tabular-nums">{formatCurrency(d.total, d.currency)}</dd>
          </div>
          <div>
            <dt className="text-xs text-white/70">Transactions</dt>
            <dd className="text-2xl font-bold tabular-nums">{d.count}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-xs text-white/70">Average</dt>
            <dd className="text-2xl font-bold tabular-nums">{formatCurrency(d.count ? d.total / d.count : 0, d.currency)}</dd>
          </div>
        </dl>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 font-semibold text-slate-900">By category</h2>
          {d.cats.length === 0 ? (
            <p className="text-sm text-slate-500">No spending in this period.</p>
          ) : (
            <ul className="space-y-3">
              {d.cats.map(([cat, total, count]) => (
                <li key={cat}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {cat} <span className="text-xs font-normal text-slate-400">· {count}</span>
                    </span>
                    <span className="tabular-nums text-slate-900">{formatCurrency(total, d.currency)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${d.total ? (total / d.total) * 100 : 0}%`, backgroundColor: CATEGORY_META[cat].color }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {d.months.length > 0 && (
          <section className="card p-5">
            <h2 className="mb-4 font-semibold text-slate-900">Monthly trend</h2>
            <div className="flex h-44 items-end gap-1.5" role="img" aria-label="Monthly spending bar chart">
              {d.months.map(([key, v]) => (
                <div key={key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <div
                    className="w-full rounded-t-md bg-indigo-500/80"
                    style={{ height: `${(v / maxMonth) * 100}%`, minHeight: v > 0 ? 3 : 0 }}
                    title={`${formatMonth(key, 'long')}: ${formatCurrency(v, d.currency)}`}
                  />
                  <span className="text-[10px] text-slate-400">{formatMonth(key)}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {d.tx && d.tx.length > 0 && (
        <section className="card overflow-hidden">
          <h2 className="border-b border-slate-100 px-5 py-3 font-semibold text-slate-900">
            Transactions {d.tx.length < d.count && <span className="text-sm font-normal text-slate-400">(latest {d.tx.length} of {d.count})</span>}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {d.tx.map(([date, cat, amount, desc], i) => (
                  <tr key={i}>
                    <td className="whitespace-nowrap px-5 py-2 text-slate-500">{formatDate(date)}</td>
                    <td className="px-2 py-2 text-slate-700">{desc}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-xs text-slate-500">{cat}</td>
                    <td className="whitespace-nowrap px-5 py-2 text-right font-medium tabular-nums text-slate-900">{formatCurrency(amount, d.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <footer className="flex flex-col items-center gap-1 pb-4 text-center text-xs text-slate-400">
        <p className="inline-flex items-center gap-1.5">
          <ShieldIcon size={14} /> This report lives entirely in its link — no data was uploaded to view it.
        </p>
        <p>
          Snapshot taken {new Date(d.c).toLocaleString()}
          {d.x && ` · expires ${new Date(d.x).toLocaleString()}`}
        </p>
      </footer>
    </article>
  );
}
