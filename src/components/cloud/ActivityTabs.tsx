'use client';

import { useEffect, useState } from 'react';
import { useCloudExport } from '@/components/providers/CloudExportProvider';
import { ClockIcon, LinkIcon, PencilIcon, PlayIcon, QrIcon, RefreshIcon, TrashIcon } from '@/components/ui/Icons';
import { Modal } from '@/components/ui/Modal';
import { DESTINATIONS, formatBytes, timeAgo } from '@/lib/cloud/destinations';
import { describeTiming } from '@/lib/cloud/schedule';
import { getTemplate } from '@/lib/cloud/templates';
import type { Schedule, ShareLink } from '@/lib/cloud/types';
import { DestinationGlyph } from './DestinationGlyph';
import { Toggle } from './DestinationPanels';
import { CopyButton, ShareResult } from './ShareResult';

type Tab = 'activity' | 'automations' | 'links';

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function timeUntil(iso: string, now: number): string {
  const mins = Math.round((new Date(iso).getTime() - now) / 60_000);
  if (mins <= 0) return 'due now';
  if (mins < 60) return `in ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `in ${hrs} hr`;
  const days = Math.round(hrs / 24);
  return `in ${days} day${days === 1 ? '' : 's'}`;
}

export function ActivityTabs({ onNewSchedule, onEditSchedule }: { onNewSchedule: () => void; onEditSchedule: (s: Schedule) => void }) {
  const { history, schedules, shares } = useCloudExport();
  const [tab, setTab] = useState<Tab>('activity');
  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'activity', label: 'Activity', count: history.length },
    { id: 'automations', label: 'Automations', count: schedules.length },
    { id: 'links', label: 'Shared links', count: shares.length },
  ];

  return (
    <section className="card overflow-hidden">
      <div role="tablist" aria-label="Export activity" className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3 pt-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              tab === t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
            <span className={`rounded-full px-1.5 text-[11px] ${tab === t.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{t.count}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'activity' && <ActivityList />}
        {tab === 'automations' && <AutomationList onNew={onNewSchedule} onEdit={onEditSchedule} />}
        {tab === 'links' && <LinkList />}
      </div>
    </section>
  );
}

function Empty({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">{icon}</span>
      <p className="font-medium text-slate-800">{title}</p>
      <p className="max-w-sm text-sm text-slate-500">{text}</p>
      {action}
    </div>
  );
}

const TRIGGER_BADGE = {
  manual: null,
  schedule: { label: 'Scheduled', cls: 'bg-indigo-50 text-indigo-700' },
  'live-sync': { label: 'Live sync', cls: 'bg-emerald-50 text-emerald-700' },
} as const;

function ActivityList() {
  const { history, runExport, clearHistory } = useCloudExport();
  const now = useNow();
  if (!history.length) {
    return <Empty icon={<RefreshIcon size={20} />} title="No exports yet" text="Everything you export, send, sync or share will be logged here with a timestamp." />;
  }
  return (
    <>
      <ul className="divide-y divide-slate-100">
        {history.map((h) => {
          const t = getTemplate(h.templateId);
          const badge = TRIGGER_BADGE[h.trigger];
          return (
            <li key={h.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <DestinationGlyph id={h.destination} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                  <span className="font-medium text-slate-900">{t.name}</span>
                  <span className="text-slate-400">→ {DESTINATIONS[h.destination].name}</span>
                  {badge && <span className={`rounded px-1.5 py-px text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>}
                  {h.status === 'failed' && <span className="rounded bg-rose-50 px-1.5 py-px text-[10px] font-semibold text-rose-700">Failed</span>}
                </p>
                <p className={`truncate text-xs ${h.status === 'failed' ? 'text-rose-600' : 'text-slate-500'}`} title={h.error ?? h.detail}>
                  {h.status === 'failed' ? h.error : h.detail}
                </p>
              </div>
              <div className="hidden shrink-0 text-right text-xs sm:block">
                <p className="text-slate-700" title={new Date(h.createdAt).toLocaleString()}>
                  {timeAgo(h.createdAt, now)}
                </p>
                {h.status === 'completed' && (
                  <p className="text-slate-400">
                    {h.rows} rows · {formatBytes(h.bytes)}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="btn-icon"
                title="Run again"
                aria-label={`Run ${t.name} to ${DESTINATIONS[h.destination].name} again`}
                onClick={() => void runExport({ templateId: h.templateId, period: h.period, destination: h.destination })}
                disabled={h.destination === 'email' || h.destination === 'link'}
              >
                <RefreshIcon size={16} />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-slate-100 px-5 py-2.5 text-right">
        <button type="button" onClick={clearHistory} className="text-xs font-medium text-slate-500 hover:text-rose-600">
          Clear history
        </button>
      </div>
    </>
  );
}

function AutomationList({ onNew, onEdit }: { onNew: () => void; onEdit: (s: Schedule) => void }) {
  const { schedules, updateSchedule, removeSchedule, runScheduleNow, connections } = useCloudExport();
  const now = useNow();
  if (!schedules.length) {
    return (
      <Empty
        icon={<ClockIcon size={20} />}
        title="No automations"
        text="Schedule recurring backups or reports — weekly to Dropbox, monthly to your accountant's inbox."
        action={
          <button type="button" className="btn btn-primary mt-2" onClick={onNew}>
            <ClockIcon size={16} /> New automation
          </button>
        }
      />
    );
  }
  return (
    <>
      <ul className="divide-y divide-slate-100">
        {schedules.map((s) => {
          const broken = s.destination !== 'email' && !connections[s.destination];
          return (
            <li key={s.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:px-5 ${s.active ? '' : 'opacity-70'}`}>
              <DestinationGlyph id={s.destination} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{s.name}</p>
                <p className="truncate text-xs text-slate-500">
                  {describeTiming(s)}
                  {s.destination === 'email' && s.recipients.length > 0 && ` · ${s.recipients.length} recipient${s.recipients.length === 1 ? '' : 's'}`}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {broken ? (
                    <span className="font-medium text-amber-700">Paused — {DESTINATIONS[s.destination].name} disconnected</span>
                  ) : s.active ? (
                    <>
                      Next run <span className="font-medium text-slate-600">{timeUntil(s.nextRunAt, now)}</span>
                    </>
                  ) : (
                    'Paused'
                  )}
                  {s.lastRunAt && ` · last ran ${timeAgo(s.lastRunAt, now)}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <div className="mr-2 w-10" title={s.active ? 'Pause' : 'Resume'}>
                  <Toggle checked={s.active && !broken} onChange={(active) => updateSchedule(s.id, { active })} label={`${s.name} active`} hideLabel />
                </div>
                <button type="button" className="btn-icon" title="Run now" aria-label={`Run ${s.name} now`} onClick={() => runScheduleNow(s.id)} disabled={broken}>
                  <PlayIcon size={15} />
                </button>
                <button type="button" className="btn-icon" title="Edit" aria-label={`Edit ${s.name}`} onClick={() => onEdit(s)}>
                  <PencilIcon size={15} />
                </button>
                <button type="button" className="btn-icon hover:text-rose-600" title="Delete" aria-label={`Delete ${s.name}`} onClick={() => removeSchedule(s.id)}>
                  <TrashIcon size={15} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-slate-100 px-5 py-3">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onNew}>
          <ClockIcon size={14} /> New automation
        </button>
      </div>
    </>
  );
}

function LinkList() {
  const { shares, removeShare } = useCloudExport();
  const now = useNow();
  const [qr, setQr] = useState<ShareLink | null>(null);
  if (!shares.length) {
    return <Empty icon={<LinkIcon size={20} />} title="No shared links" text="Create a read-only report link anyone can open — no account needed. Great for partners and accountants." />;
  }
  return (
    <>
      <ul className="divide-y divide-slate-100">
        {shares.map((l) => {
          const expired = l.expiresAt !== null && new Date(l.expiresAt).getTime() < now;
          return (
            <li key={l.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <DestinationGlyph id="link" size="sm" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-slate-900">{l.title}</span>
                  <span className="text-slate-400">{l.period}</span>
                  {expired ? (
                    <span className="rounded bg-slate-100 px-1.5 py-px text-[10px] font-semibold text-slate-500">Expired</span>
                  ) : (
                    <span className="rounded bg-emerald-50 px-1.5 py-px text-[10px] font-semibold text-emerald-700">Active</span>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  Created {timeAgo(l.createdAt, now)} ·{' '}
                  {l.expiresAt ? `${expired ? 'expired' : 'expires'} ${new Date(l.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : 'never expires'} ·{' '}
                  {l.includeTransactions ? 'with transactions' : 'totals only'}
                </p>
              </div>
              {!expired && (
                <>
                  <CopyButton text={l.url} label="Copy" className="btn btn-secondary btn-sm" />
                  <button type="button" className="btn-icon" title="Show QR code" aria-label="Show QR code" onClick={() => setQr(l)}>
                    <QrIcon size={16} />
                  </button>
                </>
              )}
              <button type="button" className="btn-icon hover:text-rose-600" title="Remove from list" aria-label="Remove link from list" onClick={() => removeShare(l.id)}>
                <TrashIcon size={15} />
              </button>
            </li>
          );
        })}
      </ul>
      {qr && (
        <Modal open size="md" onClose={() => setQr(null)} title={`${qr.title} · ${qr.period}`} description="Scan to open the shared report on any device.">
          <ShareResult url={qr.url} filenameBase={qr.title.toLowerCase().replace(/\s+/g, '-')} />
        </Modal>
      )}
    </>
  );
}
