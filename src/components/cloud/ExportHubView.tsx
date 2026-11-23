'use client';

import { useMemo, useState } from 'react';
import { useCloudExport, type NewSchedule } from '@/components/providers/CloudExportProvider';
import { useExpenses } from '@/components/providers/ExpenseProvider';
import { ClockIcon, CloudIcon, LinkIcon, MailIcon, RefreshIcon, ShieldIcon, ZapIcon } from '@/components/ui/Icons';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { DESTINATIONS, INTEGRATION_IDS, timeAgo } from '@/lib/cloud/destinations';
import { TEMPLATES, defaultPeriod } from '@/lib/cloud/templates';
import type { DestinationId, IntegrationId, Schedule, TemplateId } from '@/lib/cloud/types';
import { ActivityTabs } from './ActivityTabs';
import { ConnectPanel } from './ConnectPanel';
import { DestinationGlyph, TemplateGlyph } from './DestinationGlyph';
import { Toggle } from './DestinationPanels';
import { ExportFlowDialog, type ScheduleDraft } from './ExportFlowDialog';
import { ScheduleDialog } from './ScheduleDialog';
import { SyncStatusPill } from './SyncStatusPill';

type Dialog =
  | { kind: 'none' }
  | { kind: 'flow'; template?: TemplateId; destination?: DestinationId; key: number }
  | { kind: 'schedule'; initial?: Partial<NewSchedule>; editing?: Schedule; key: number }
  | { kind: 'connect'; id: IntegrationId };

const BACKUP_STALE_DAYS = 7;

export function ExportHubView() {
  const { expenses, isLoaded } = useExpenses();
  const cloud = useCloudExport();
  const [dialog, setDialog] = useState<Dialog>({ kind: 'none' });
  const close = () => setDialog({ kind: 'none' });
  const openFlow = (template?: TemplateId, destination?: DestinationId) => setDialog({ kind: 'flow', template, destination, key: Date.now() });
  const openSchedule = (initial?: Partial<NewSchedule>, editing?: Schedule) => setDialog({ kind: 'schedule', initial, editing, key: Date.now() });

  const backupInsight = useMemo(() => {
    const hasBackupSchedule = cloud.schedules.some((s) => s.templateId === 'full-backup' && s.active);
    if (hasBackupSchedule || !expenses.length) return null;
    const last = cloud.history.find((h) => h.templateId === 'full-backup' && h.status === 'completed');
    const days = last ? Math.floor((Date.now() - new Date(last.createdAt).getTime()) / 86_400_000) : null;
    if (days !== null && days < BACKUP_STALE_DAYS) return null;
    return { last, days };
  }, [cloud.schedules, cloud.history, expenses.length]);

  const storage = INTEGRATION_IDS.find((id) => id !== 'google-sheets' && cloud.connections[id]);

  if (!isLoaded || !cloud.hydrated) {
    return (
      <>
        <PageHeader title="Export & Sync" description="Send, sync and share your spending data." />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Export & Sync"
        description="Send reports, sync to your cloud apps, automate backups and share live links."
        actions={
          <>
            <SyncStatusPill />
            <button type="button" className="btn btn-primary" onClick={() => openFlow()} disabled={!expenses.length}>
              <CloudIcon size={18} /> New export
            </button>
          </>
        }
      />

      <div className="space-y-6 sm:space-y-8">
        {!expenses.length && (
          <div className="card flex items-center gap-3 p-4 text-sm text-slate-600">
            <CloudIcon size={20} className="text-slate-400" />
            Add some expenses first — then come back to export, sync and share them.
          </div>
        )}

        {backupInsight && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 p-5 text-white shadow-lg sm:p-6">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-2xl" aria-hidden="true" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <ShieldIcon size={20} />
                </span>
                <div>
                  <p className="font-semibold">
                    {backupInsight.last ? `Last backup was ${backupInsight.days} days ago` : 'Your data has never been backed up'}
                  </p>
                  <p className="mt-0.5 text-sm text-indigo-200">
                    {expenses.length} expenses live only in this browser. Turn on automatic weekly backups so nothing is lost.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  className="btn bg-white text-slate-900 hover:bg-indigo-50"
                  onClick={() =>
                    openSchedule({
                      templateId: 'full-backup',
                      destination: storage ?? 'email',
                      frequency: 'weekly',
                      weekday: 0,
                      time: '21:00',
                    })
                  }
                >
                  <ClockIcon size={16} /> Automate backups
                </button>
                <button
                  type="button"
                  className="btn border border-white/20 text-white hover:bg-white/10"
                  onClick={() => void cloud.runExport({ templateId: 'full-backup', period: 'all', destination: storage ?? 'download' })}
                >
                  Back up now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick actions */}
        {expenses.length > 0 && (
          <section aria-labelledby="quick-heading">
            <h2 id="quick-heading" className="sr-only">
              Quick actions
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <QuickAction icon={<MailIcon size={18} />} title="Email this month's summary" text="To your partner or accountant" onClick={() => openFlow('monthly-summary', 'email')} />
              <QuickAction icon={<LinkIcon size={18} />} title="Share a live report link" text="Read-only · QR code · expiring" onClick={() => openFlow('category-analysis', 'link')} />
              <QuickAction icon={<ZapIcon size={18} />} title="Sync to Google Sheets" text="Keep a spreadsheet always up to date" onClick={() => openFlow('tax-report', 'google-sheets')} />
            </div>
          </section>
        )}

        {/* Templates */}
        <section aria-labelledby="templates-heading">
          <SectionHeading id="templates-heading" title="Templates" subtitle="Purpose-built exports for the people you share with." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {TEMPLATES.map((t) => {
              const uses = cloud.history.filter((h) => h.templateId === t.id && h.status === 'completed').length;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => openFlow(t.id)}
                  disabled={!expenses.length}
                  className="group card flex flex-col gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-60"
                >
                  <div className="flex items-start justify-between">
                    <TemplateGlyph path={t.icon} gradient={t.accent.gradient} />
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">{t.format}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.tagline}</p>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-1">
                    {t.bestFor.map((b) => (
                      <span key={b} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${t.accent.soft} ${t.accent.text}`}>
                        {b}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {t.periodKind === 'all' ? 'All time' : t.periodKind === 'year' ? `Default: ${defaultPeriod('year')}` : 'Default: this month'}
                    {uses > 0 && ` · used ${uses}×`}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Integrations */}
        <section aria-labelledby="apps-heading">
          <SectionHeading id="apps-heading" title="Connected apps" subtitle="Link your cloud accounts once, then export anywhere in a click." />
          <div className="grid gap-3 sm:grid-cols-2">
            {INTEGRATION_IDS.map((id) => {
              const meta = DESTINATIONS[id];
              const conn = cloud.connections[id];
              const syncing = cloud.jobs.some((j) => j.destination === id && j.status === 'running');
              return (
                <div key={id} className="card flex min-w-0 flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <DestinationGlyph id={id} />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 font-semibold text-slate-900">
                        {meta.name}
                        {conn && (
                          <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${syncing ? 'text-indigo-600' : 'text-emerald-600'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${syncing ? 'animate-pulse bg-indigo-500' : 'bg-emerald-500'}`} />
                            {syncing ? 'Syncing' : 'Connected'}
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {conn ? `${conn.account} · ${conn.target}` : meta.description}
                      </p>
                      {conn && (
                        <p className="text-[11px] text-slate-400">
                          {conn.lastSyncAt ? `Last sync ${timeAgo(conn.lastSyncAt)}` : 'Never synced'}
                        </p>
                      )}
                    </div>
                    {conn ? (
                      <div className="flex shrink-0 gap-1">
                        <button type="button" className="btn-icon" title="Sync now" aria-label={`Sync ${meta.name} now`} onClick={() => cloud.syncNow(id)} disabled={syncing}>
                          <RefreshIcon size={16} className={syncing ? 'animate-spin' : ''} />
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => cloud.disconnect(id)}>
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDialog({ kind: 'connect', id })}>
                        Connect
                      </button>
                    )}
                  </div>
                  {conn && id === 'google-sheets' && (
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <Toggle
                        checked={conn.liveSync}
                        onChange={(liveSync) => cloud.updateConnection(id, { liveSync })}
                        label="Live sync"
                        description="Pushes this year's transactions to the sheet a few seconds after every change."
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <ActivityTabs onNewSchedule={() => openSchedule()} onEditSchedule={(s) => openSchedule(undefined, s)} />
      </div>

      {dialog.kind === 'flow' && (
        <ExportFlowDialog
          key={dialog.key}
          initialTemplate={dialog.template}
          initialDestination={dialog.destination}
          onClose={close}
          onSchedule={(d: ScheduleDraft) => openSchedule({ templateId: d.templateId, destination: d.destination, recipients: d.recipients ?? [] })}
        />
      )}
      {dialog.kind === 'schedule' && <ScheduleDialog key={dialog.key} initial={dialog.initial} editing={dialog.editing} onClose={close} />}
      {dialog.kind === 'connect' && (
        <Modal open size="sm" onClose={close} title={`Connect ${DESTINATIONS[dialog.id].name}`}>
          <ConnectPanel id={dialog.id} onConnected={close} />
        </Modal>
      )}
    </>
  );
}

function SectionHeading({ id, title, subtitle }: { id: string; title: string; subtitle: string }) {
  return (
    <div className="mb-3">
      <h2 id={id} className="text-base font-semibold text-slate-900">
        {title}
      </h2>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function QuickAction({ icon, title, text, onClick }: { icon: React.ReactNode; title: string; text: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="card flex items-center gap-3 p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-900">{title}</span>
        <span className="block truncate text-xs text-slate-500">{text}</span>
      </span>
    </button>
  );
}
