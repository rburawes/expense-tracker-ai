'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCloudExport } from '@/components/providers/CloudExportProvider';
import { AlertCircleIcon, CloudCheckIcon, CloudIcon } from '@/components/ui/Icons';
import { Spinner } from '@/components/ui/Spinner';
import { timeAgo } from '@/lib/cloud/destinations';

/** Header indicator: live sync state, links to the Export Hub. */
export function SyncStatusPill({ compact = false }: { compact?: boolean }) {
  const { status, hydrated } = useCloudExport();
  // Re-render every 30s so "2 min ago" stays fresh.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  if (!hydrated) return null;

  const view =
    status.kind === 'syncing'
      ? { icon: <Spinner className="h-3.5 w-3.5" />, label: 'Syncing…', title: status.label, cls: 'bg-indigo-50 text-indigo-700 ring-indigo-200' }
      : status.kind === 'attention'
        ? { icon: <AlertCircleIcon size={15} />, label: 'Needs attention', title: status.label, cls: 'bg-amber-50 text-amber-800 ring-amber-200' }
        : status.kind === 'synced'
          ? {
              icon: <CloudCheckIcon size={15} />,
              label: status.at ? `Synced ${timeAgo(status.at)}` : 'Connected',
              title: 'All exports up to date',
              cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
            }
          : { icon: <CloudIcon size={15} />, label: 'Export & sync', title: 'Set up cloud exports', cls: 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50' };

  return (
    <Link
      href="/export"
      title={view.title}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition ${view.cls}`}
    >
      {view.icon}
      <span className={compact ? 'sr-only' : ''}>{view.label}</span>
      {status.kind === 'syncing' && <span className="sr-only">{status.label}</span>}
    </Link>
  );
}
