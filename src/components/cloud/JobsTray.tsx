'use client';

import { useState } from 'react';
import { AlertCircleIcon, CheckIcon } from '@/components/ui/Icons';
import { Spinner } from '@/components/ui/Spinner';
import type { Job } from '@/lib/cloud/types';
import { DestinationGlyph } from './DestinationGlyph';

/** Floating "background tasks" panel, visible on every page while jobs run. */
export function JobsTray({ jobs }: { jobs: Job[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const visible = jobs.filter((j) => !j.quiet);
  if (!visible.length) return null;
  const running = visible.filter((j) => j.status === 'running').length;

  return (
    <section
      aria-label="Background tasks"
      className="fixed bottom-24 left-4 z-50 w-[min(22rem,calc(100vw-2rem))] animate-toast-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 md:bottom-6 md:left-6"
    >
      <header className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-700" aria-live="polite">
          {running ? <Spinner className="h-3.5 w-3.5 text-indigo-600" /> : <CheckIcon size={14} className="text-emerald-600" />}
          {running ? `${running} task${running === 1 ? '' : 's'} running in background` : 'All tasks finished'}
        </p>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-500 hover:bg-slate-200/60"
          aria-expanded={!collapsed}
        >
          {collapsed ? 'Show' : 'Hide'}
        </button>
      </header>
      {!collapsed && (
        <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
          {visible.map((j) => (
            <li key={j.id} className="flex items-center gap-3 px-4 py-3">
              <DestinationGlyph id={j.destination} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{j.title}</p>
                <p
                  className={`truncate text-xs ${
                    j.status === 'failed' ? 'text-rose-600' : j.status === 'done' ? 'text-emerald-600' : 'text-slate-500'
                  }`}
                >
                  {j.status === 'running' ? `${j.stage}…` : j.stage}
                </p>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                      j.status === 'failed' ? 'bg-rose-500' : j.status === 'done' ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.round(j.progress * 100)}%` }}
                  />
                </div>
              </div>
              <span className="shrink-0" aria-hidden="true">
                {j.status === 'running' ? (
                  <Spinner className="h-4 w-4 text-slate-400" />
                ) : j.status === 'done' ? (
                  <CheckIcon size={16} className="text-emerald-600" />
                ) : (
                  <AlertCircleIcon size={16} className="text-rose-600" />
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
