'use client';

import { useId, useMemo, useState } from 'react';
import { useCloudExport, type NewSchedule } from '@/components/providers/CloudExportProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { ClockIcon } from '@/components/ui/Icons';
import { Modal } from '@/components/ui/Modal';
import { DESTINATIONS, INTEGRATION_IDS } from '@/lib/cloud/destinations';
import { FREQUENCY_LABELS, WEEKDAYS, describeTiming, upcomingRuns } from '@/lib/cloud/schedule';
import { TEMPLATES, getTemplate } from '@/lib/cloud/templates';
import type { Frequency, Schedule } from '@/lib/cloud/types';
import { DestinationGlyph } from './DestinationGlyph';
import { RecipientInput } from './DestinationPanels';

const SCHEDULE_DESTINATIONS: Schedule['destination'][] = ['email', ...INTEGRATION_IDS];

export function ScheduleDialog({
  initial,
  editing,
  onClose,
}: {
  initial?: Partial<NewSchedule>;
  editing?: Schedule;
  onClose: () => void;
}) {
  const { connections, addSchedule, updateSchedule } = useCloudExport();
  const { toast } = useToast();
  const nameId = useId();
  const timeId = useId();
  const dayId = useId();

  // Backups are files: prefer a storage service over Sheets when choosing a default.
  const firstConnected =
    INTEGRATION_IDS.find((id) => id !== 'google-sheets' && connections[id]) ?? INTEGRATION_IDS.find((id) => connections[id]);
  const [s, setS] = useState<NewSchedule>(() => {
    const base: NewSchedule = {
      name: '',
      templateId: 'full-backup',
      destination: firstConnected ?? 'email',
      frequency: 'weekly',
      time: '09:00',
      weekday: 1,
      dayOfMonth: 1,
      recipients: [],
      active: true,
    };
    const merged = { ...base, ...(editing ?? {}), ...(initial ?? {}) };
    if (!merged.name) merged.name = `${getTemplate(merged.templateId).name} → ${DESTINATIONS[merged.destination].short}`;
    return merged;
  });
  const [nameTouched, setNameTouched] = useState(!!editing);
  const set = (patch: Partial<NewSchedule>) =>
    setS((prev) => {
      const next = { ...prev, ...patch };
      if (!nameTouched && (patch.templateId || patch.destination)) {
        next.name = `${getTemplate(next.templateId).name} → ${DESTINATIONS[next.destination].short}`;
      }
      return next;
    });

  const runs = useMemo(() => upcomingRuns(s, 3), [s]);
  const needsConnection = s.destination !== 'email' && !connections[s.destination];
  const needsRecipients = s.destination === 'email' && s.recipients.length === 0;
  const valid = s.name.trim() && !needsConnection && !needsRecipients;

  function save() {
    if (!valid) return;
    if (editing) updateSchedule(editing.id, { ...s, name: s.name.trim() });
    else addSchedule({ ...s, name: s.name.trim() });
    toast({ type: 'success', title: editing ? 'Schedule updated' : 'Automation created', description: describeTiming(s) });
    onClose();
  }

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={editing ? 'Edit automation' : 'New automation'}
      description="Recurring exports run in the background while Spendwise is open, and catch up on missed runs next time you visit."
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={!valid}>
            <ClockIcon size={16} />
            {editing ? 'Save changes' : 'Create automation'}
          </button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_15rem]">
        <div className="space-y-5">
          <div>
            <label htmlFor={nameId} className="label">
              Name
            </label>
            <input
              id={nameId}
              className="input"
              value={s.name}
              onChange={(e) => {
                setNameTouched(true);
                set({ name: e.target.value });
              }}
            />
          </div>

          <fieldset>
            <legend className="label">Template</legend>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={s.templateId === t.id}
                  onClick={() => set({ templateId: t.id })}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                    s.templateId === t.id ? `border-transparent ring-2 ${t.accent.ring} ${t.accent.soft} ${t.accent.text} font-semibold` : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="label">Deliver to</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SCHEDULE_DESTINATIONS.map((id) => {
                const connected = id === 'email' || !!connections[id];
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={s.destination === id}
                    onClick={() => set({ destination: id })}
                    className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-sm transition ${
                      s.destination === id ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:bg-slate-50'
                    } ${connected ? '' : 'opacity-60'}`}
                  >
                    <DestinationGlyph id={id} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-800">{DESTINATIONS[id].short}</span>
                      <span className="block text-[10px] text-slate-400">{connected ? (id === 'email' ? 'Built in' : 'Connected') : 'Not connected'}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {needsConnection && (
              <p className="mt-2 text-xs text-amber-700">Connect {DESTINATIONS[s.destination].name} from the Connected apps section first.</p>
            )}
          </fieldset>

          {s.destination === 'email' && <RecipientInput value={s.recipients} onChange={(recipients) => set({ recipients })} />}

          <fieldset>
            <legend className="label">Repeat</legend>
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={s.frequency === f}
                  onClick={() => set({ frequency: f })}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${s.frequency === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {FREQUENCY_LABELS[f]}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {s.frequency === 'weekly' && (
                <div>
                  <label htmlFor={dayId} className="mb-1 block text-xs font-medium text-slate-500">
                    On
                  </label>
                  <select id={dayId} className="input" value={s.weekday} onChange={(e) => set({ weekday: Number(e.target.value) })}>
                    {WEEKDAYS.map((d, i) => (
                      <option key={d} value={i}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {s.frequency === 'monthly' && (
                <div>
                  <label htmlFor={dayId} className="mb-1 block text-xs font-medium text-slate-500">
                    Day of month
                  </label>
                  <select id={dayId} className="input" value={s.dayOfMonth} onChange={(e) => set({ dayOfMonth: Number(e.target.value) })}>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label htmlFor={timeId} className="mb-1 block text-xs font-medium text-slate-500">
                  At
                </label>
                <input id={timeId} type="time" className="input" value={s.time} onChange={(e) => e.target.value && set({ time: e.target.value })} />
              </div>
            </div>
          </fieldset>
        </div>

        {/* Live "what will happen" preview */}
        <aside className="h-fit rounded-2xl border border-slate-200 bg-gradient-to-b from-indigo-50/60 to-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">Preview</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{describeTiming(s)}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {getTemplate(s.templateId).name} → {DESTINATIONS[s.destination].name}
          </p>
          <ol className="mt-4 space-y-2.5 border-l-2 border-indigo-100 pl-3">
            {runs.map((d, i) => (
              <li key={d.toISOString()} className="relative text-xs">
                <span className={`absolute -left-[1.06rem] top-1 h-2 w-2 rounded-full ${i === 0 ? 'bg-indigo-500' : 'bg-indigo-200'}`} aria-hidden="true" />
                <span className="font-medium text-slate-800">
                  {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="text-slate-500"> · {d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                {i === 0 && <span className="ml-1 rounded bg-indigo-100 px-1 text-[10px] font-semibold text-indigo-700">next</span>}
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </Modal>
  );
}
