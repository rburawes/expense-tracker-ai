'use client';

import { useMemo, useState } from 'react';
import { useCloudExport } from '@/components/providers/CloudExportProvider';
import { useExpenses } from '@/components/providers/ExpenseProvider';
import { ChevronLeftIcon, ClockIcon, LinkIcon } from '@/components/ui/Icons';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { DESTINATIONS, DESTINATION_ORDER, isIntegration } from '@/lib/cloud/destinations';
import { buildShareUrl, buildSnapshot, encodeSnapshot } from '@/lib/cloud/share';
import { TEMPLATES, availablePeriods, defaultPeriod, getTemplate, periodLabel } from '@/lib/cloud/templates';
import type { DestinationId, IntegrationId, Schedule, TemplateId } from '@/lib/cloud/types';
import { createId } from '@/lib/id';
import { ConnectPanel } from './ConnectPanel';
import { DestinationGlyph, TemplateGlyph } from './DestinationGlyph';
import { EmailPanel, PreviewTable, SheetsPanel, StoragePanel, Toggle, type EmailDraft, type SheetsDraft } from './DestinationPanels';
import { ShareResult } from './ShareResult';

type Step = 'template' | 'destination' | 'configure' | 'shared';

const EXPIRY_OPTIONS = [
  { value: '1', label: '24 hours' },
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: 'never', label: 'Never' },
] as const;

export interface ScheduleDraft {
  templateId: TemplateId;
  destination?: Schedule['destination'];
  recipients?: string[];
}

export function ExportFlowDialog({
  initialTemplate,
  initialDestination,
  onClose,
  onSchedule,
}: {
  initialTemplate?: TemplateId;
  initialDestination?: DestinationId;
  onClose: () => void;
  onSchedule: (draft: ScheduleDraft) => void;
}) {
  const { expenses, currency } = useExpenses();
  const { connections, runExport, addShare, updateConnection } = useCloudExport();

  const [step, setStep] = useState<Step>(initialTemplate ? (initialDestination ? 'configure' : 'destination') : 'template');
  const [templateId, setTemplateId] = useState<TemplateId>(initialTemplate ?? 'monthly-summary');
  const template = getTemplate(templateId);
  const [period, setPeriod] = useState(() => defaultPeriod(template.periodKind));
  const [destination, setDestination] = useState<DestinationId>(initialDestination ?? 'download');
  const dest = DESTINATIONS[destination];
  const conn = isIntegration(destination) ? connections[destination] : undefined;

  const [email, setEmail] = useState<EmailDraft>(() => ({
    to: [],
    subject: `${template.name} — ${periodLabel(period)}`,
    message: '',
  }));
  const [sheets, setSheets] = useState<SheetsDraft>({
    name: connections['google-sheets']?.target ?? 'Spendwise Expenses',
    mode: 'new',
    live: connections['google-sheets']?.liveSync ?? false,
  });
  const [folder, setFolder] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<(typeof EXPIRY_OPTIONS)[number]['value']>('7');
  const [includeTx, setIncludeTx] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const periods = useMemo(() => availablePeriods(expenses, template.periodKind), [expenses, template.periodKind]);
  const built = useMemo(() => template.build(expenses, period, currency), [template, expenses, period, currency]);
  const empty = built.rows === 0 && templateId !== 'full-backup';

  function chooseTemplate(id: TemplateId) {
    const t = getTemplate(id);
    const p = defaultPeriod(t.periodKind);
    setTemplateId(id);
    setPeriod(p);
    setEmail((e) => ({ ...e, subject: `${t.name} — ${periodLabel(p)}` }));
  }

  function changePeriod(p: string) {
    setPeriod(p);
    setEmail((e) => ({ ...e, subject: `${template.name} — ${periodLabel(p)}` }));
  }

  const canSubmit =
    !empty &&
    !busy &&
    (destination !== 'email' || email.to.length > 0) &&
    (!isIntegration(destination) || !!conn) &&
    (destination !== 'google-sheets' || sheets.name.trim() !== '');

  async function submit() {
    if (!canSubmit) return;
    if (destination === 'link') {
      setBusy(true);
      try {
        const expiresAt = expiry === 'never' ? null : new Date(Date.now() + Number(expiry) * 86_400_000);
        const snapshot = buildSnapshot(expenses, templateId, period, currency, { includeTransactions: includeTx, expiresAt });
        const url = buildShareUrl(window.location.origin, await encodeSnapshot(snapshot));
        addShare({
          id: createId(),
          templateId,
          title: template.name,
          period: periodLabel(period),
          url,
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt?.toISOString() ?? null,
          includeTransactions: includeTx,
        });
        setShareUrl(url);
        setStep('shared');
      } finally {
        setBusy(false);
      }
      return;
    }
    if (destination === 'google-sheets') {
      updateConnection('google-sheets', { target: sheets.name.trim(), liveSync: sheets.live });
    } else if (isIntegration(destination) && folder !== null) {
      updateConnection(destination, { target: folder.trim() || DESTINATIONS[destination].defaultTarget || '/' });
    }
    // Fire-and-forget: progress continues in the background jobs tray.
    void runExport({
      templateId,
      period,
      destination,
      recipients: email.to,
      subject: email.subject,
      target: destination === 'google-sheets' ? sheets.name.trim() : folder?.trim() || undefined,
    });
    onClose();
  }

  const actionLabel =
    destination === 'download'
      ? 'Download'
      : destination === 'email'
        ? email.to.length
          ? `Send to ${email.to.length} recipient${email.to.length === 1 ? '' : 's'}`
          : 'Send email'
        : destination === 'link'
          ? 'Create link'
          : destination === 'google-sheets'
            ? 'Export to Sheets'
            : `Upload to ${dest.name}`;

  const canSchedule = destination !== 'download' && destination !== 'link';

  /* ------------------------------- render ------------------------------ */

  const titles: Record<Step, string> = {
    template: 'Choose a template',
    destination: 'Where should it go?',
    configure: dest.name,
    shared: 'Your link is ready',
  };

  const back =
    step === 'destination' ? () => setStep('template') : step === 'configure' ? () => setStep('destination') : step === 'shared' ? () => setStep('configure') : null;

  const footer =
    step === 'shared' ? (
      <div className="flex justify-end">
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    ) : (
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {back && (
            <button type="button" className="btn btn-ghost" onClick={back}>
              <ChevronLeftIcon size={16} /> Back
            </button>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          {step === 'configure' && canSchedule && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                onSchedule({
                  templateId,
                  destination: destination as Schedule['destination'],
                  recipients: email.to,
                })
              }
            >
              <ClockIcon size={16} /> Make it recurring
            </button>
          )}
          {step === 'template' && (
            <button type="button" className="btn btn-primary" onClick={() => setStep('destination')}>
              Continue
            </button>
          )}
          {step === 'destination' && (
            <button type="button" className="btn btn-primary" onClick={() => setStep('configure')}>
              Continue with {dest.short}
            </button>
          )}
          {step === 'configure' && (
            <button type="button" className="btn btn-primary" onClick={() => void submit()} disabled={!canSubmit}>
              {busy && <Spinner />}
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    );

  return (
    <Modal open size="lg" onClose={onClose} title={titles[step]} description={stepDescription(step, template.name, periodLabel(period))} footer={footer}>
      <StepDots step={step} />

      {step === 'template' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {TEMPLATES.map((t) => {
            const active = t.id === templateId;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={active}
                onClick={() => chooseTemplate(t.id)}
                onDoubleClick={() => {
                  chooseTemplate(t.id);
                  setStep('destination');
                }}
                className={`flex gap-3 rounded-2xl border p-4 text-left transition ${
                  active ? `border-transparent ring-2 ${t.accent.ring} ${t.accent.soft}` : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <TemplateGlyph path={t.icon} gradient={t.accent.gradient} />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{t.name}</span>
                    <span className="rounded bg-white/80 px-1.5 py-px text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">{t.format}</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">{t.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {step === 'destination' && (
        <div className="space-y-5">
          <PeriodPicker kind={template.periodKind} periods={periods} value={period} onChange={changePeriod} rows={built.rows} empty={empty} />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {DESTINATION_ORDER.map((id) => {
              const d = DESTINATIONS[id];
              const connected = !d.integration || !!connections[id as IntegrationId];
              const active = id === destination;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setDestination(id)}
                  onDoubleClick={() => {
                    setDestination(id);
                    setStep('configure');
                  }}
                  className={`relative flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition ${
                    active ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <DestinationGlyph id={id} size="sm" />
                  <span className="text-sm font-semibold text-slate-900">{d.name}</span>
                  <span className="text-[11px] leading-snug text-slate-500">{d.description}</span>
                  {d.integration && (
                    <span
                      className={`absolute right-2.5 top-2.5 h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      title={connected ? 'Connected' : 'Not connected'}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 'configure' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className={`rounded-full px-2.5 py-1 font-semibold ${template.accent.soft} ${template.accent.text}`}>{template.name}</span>
            <span>{periodLabel(period)}</span>
            <span aria-hidden="true">·</span>
            <span>
              {built.rows} {built.rows === 1 ? 'row' : 'rows'}
            </span>
            {empty && <span className="font-medium text-amber-700">— nothing to export for this period</span>}
          </div>

          {isIntegration(destination) && !conn ? (
            <div className="mx-auto max-w-sm">
              <ConnectPanel id={destination as IntegrationId} />
            </div>
          ) : destination === 'download' ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                <span className="font-mono text-slate-900">{built.filename}</span> will be saved to this device.
              </p>
              <PreviewTable preview={built.preview} caption="First rows" />
            </div>
          ) : destination === 'email' ? (
            <EmailPanel draft={email} onChange={setEmail} built={built} template={template} periodText={periodLabel(period)} />
          ) : destination === 'google-sheets' ? (
            <SheetsPanel draft={sheets} onChange={setSheets} built={built} template={template} account={conn!.account} />
          ) : destination === 'link' ? (
            <div className="space-y-4">
              <fieldset>
                <legend className="label">Link expires after</legend>
                <div className="flex flex-wrap gap-1.5">
                  {EXPIRY_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      aria-pressed={expiry === o.value}
                      onClick={() => setExpiry(o.value)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                        expiry === o.value ? 'bg-violet-600 text-white ring-violet-600' : 'text-slate-600 ring-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="rounded-xl border border-slate-200 p-3">
                <Toggle
                  checked={includeTx}
                  onChange={setIncludeTx}
                  label="Include individual transactions"
                  description="Off: recipients see totals and charts only — descriptions stay private."
                />
              </div>
              <p className="flex items-start gap-2 rounded-xl bg-violet-50 p-3 text-xs leading-relaxed text-violet-900">
                <LinkIcon size={16} className="mt-px shrink-0" />
                Links are end-to-end snapshots: the report is compressed into the link itself and never uploaded to a server.
                Anyone with the link can view it until it expires.
              </p>
            </div>
          ) : (
            <StoragePanel
              folder={folder ?? conn!.target}
              onFolder={setFolder}
              built={built}
              account={conn!.account}
              serviceName={dest.name}
            />
          )}
        </div>
      )}

      {step === 'shared' && shareUrl && <ShareResult url={shareUrl} filenameBase={built.filename.replace(/\.\w+$/, '')} />}
    </Modal>
  );
}

function stepDescription(step: Step, template: string, period: string): string {
  if (step === 'template') return 'Purpose-built layouts for the people you share with.';
  if (step === 'destination') return `${template} · pick a period and a destination.`;
  if (step === 'shared') return 'Send it, scan it, or open it to see what recipients will see.';
  return `${template} · ${period}`;
}

function StepDots({ step }: { step: Step }) {
  const order: Step[] = ['template', 'destination', 'configure'];
  const idx = step === 'shared' ? 3 : order.indexOf(step);
  return (
    <ol className="mb-5 flex gap-1.5" aria-label="Progress">
      {order.map((s, i) => (
        <li key={s} className={`h-1 flex-1 rounded-full transition-colors ${i <= idx ? 'bg-indigo-500' : 'bg-slate-200'}`}>
          <span className="sr-only">
            Step {i + 1}
            {i === idx ? ' (current)' : ''}
          </span>
        </li>
      ))}
    </ol>
  );
}

function PeriodPicker({
  kind,
  periods,
  value,
  onChange,
  rows,
  empty,
}: {
  kind: 'year' | 'month' | 'all';
  periods: string[];
  value: string;
  onChange: (p: string) => void;
  rows: number;
  empty: boolean;
}) {
  if (kind === 'all') {
    return (
      <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
        Covers <span className="font-semibold">your entire history</span> · {rows} rows
      </p>
    );
  }
  return (
    <div>
      <p className="label">{kind === 'year' ? 'Tax year' : 'Month'}</p>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {periods.slice(0, 12).map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={p === value}
            onClick={() => onChange(p)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
              p === value ? 'bg-indigo-600 text-white ring-indigo-600' : 'text-slate-600 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {kind === 'year' ? p : periodLabel(p)}
          </button>
        ))}
      </div>
      <p className={`mt-1 text-xs ${empty ? 'text-amber-700' : 'text-slate-500'}`}>
        {empty ? 'No expenses in this period.' : `${rows} rows`}
      </p>
    </div>
  );
}
