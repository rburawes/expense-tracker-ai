'use client';

import { useId, useState, type KeyboardEvent } from 'react';
import { MailIcon, XIcon, ZapIcon } from '@/components/ui/Icons';
import { formatBytes, isEmail } from '@/lib/cloud/destinations';
import type { BuiltExport, TemplateDef } from '@/lib/cloud/templates';

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

export function Toggle({
  checked,
  onChange,
  label,
  description,
  hideLabel = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  hideLabel?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'cursor-pointer'}>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-slate-500">{description}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[1.125rem]' : 'left-0.5'}`}
        />
      </button>
    </div>
  );
}

export function PreviewTable({ preview, caption }: { preview: BuiltExport['preview']; caption?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      {caption && <p className="border-b border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-500">{caption}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              {preview.columns.map((c) => (
                <th key={c} scope="col" className="whitespace-nowrap px-3 py-1.5 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {preview.rows.length === 0 ? (
              <tr>
                <td colSpan={preview.columns.length} className="px-3 py-4 text-center text-slate-400">
                  No rows for this period
                </td>
              </tr>
            ) : (
              preview.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((v, j) => (
                    <td key={j} className="max-w-[10rem] truncate whitespace-nowrap px-3 py-1.5 tabular-nums">
                      {v}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Email                                                               */
/* ------------------------------------------------------------------ */

export interface EmailDraft {
  to: string[];
  subject: string;
  message: string;
}

export function RecipientInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const id = useId();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  function commit(raw = draft) {
    const parts = raw.split(/[,;\s]+/).map((p) => p.trim()).filter(Boolean);
    if (!parts.length) return;
    const bad = parts.find((p) => !isEmail(p));
    if (bad) {
      setError(`“${bad}” is not a valid email address`);
      return;
    }
    onChange([...new Set([...value, ...parts.map((p) => p.toLowerCase())])]);
    setDraft('');
    setError(null);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (['Enter', ',', ';', 'Tab'].includes(e.key) && draft.trim()) {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div>
      <label htmlFor={id} className="label">
        To
      </label>
      <div
        className={`flex min-h-[2.75rem] flex-wrap items-center gap-1.5 rounded-xl border bg-white px-2 py-1.5 shadow-sm focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 ${
          error ? 'border-rose-400' : 'border-slate-200'
        }`}
      >
        {value.map((r) => (
          <span key={r} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 py-0.5 pl-2.5 pr-1 text-xs font-medium text-indigo-700">
            {r}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== r))} className="rounded-full p-0.5 hover:bg-indigo-100" aria-label={`Remove ${r}`}>
              <XIcon size={12} />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="email"
          className="min-w-[10rem] flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-slate-400"
          placeholder={value.length ? 'Add another…' : 'accountant@example.com'}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(null);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => draft.trim() && commit()}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text');
            if (/[,;\s]/.test(text)) {
              e.preventDefault();
              commit(text);
            }
          }}
          data-autofocus
        />
      </div>
      {error ? <p className="field-error">{error}</p> : <p className="mt-1.5 text-xs text-slate-400">Press Enter or comma to add. Paste a list to add many.</p>}
    </div>
  );
}

export function EmailPanel({
  draft,
  onChange,
  built,
  template,
  periodText,
}: {
  draft: EmailDraft;
  onChange: (d: EmailDraft) => void;
  built: BuiltExport;
  template: TemplateDef;
  periodText: string;
}) {
  const subjectId = useId();
  const msgId = useId();
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-4">
        <RecipientInput value={draft.to} onChange={(to) => onChange({ ...draft, to })} />
        <div>
          <label htmlFor={subjectId} className="label">
            Subject
          </label>
          <input id={subjectId} className="input" value={draft.subject} onChange={(e) => onChange({ ...draft, subject: e.target.value })} />
        </div>
        <div>
          <label htmlFor={msgId} className="label">
            Message <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id={msgId}
            rows={3}
            className="input resize-none"
            value={draft.message}
            onChange={(e) => onChange({ ...draft, message: e.target.value })}
            placeholder="Hi! Here's my expense report…"
          />
        </div>
      </div>

      {/* Inbox-style preview of what the recipient sees */}
      <div aria-label="Email preview" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-[11px] text-slate-500">
          <p>
            <span className="font-semibold text-slate-700">Spendwise Reports</span> · via Spendwise
          </p>
          <p className="truncate">to {draft.to.length ? draft.to.join(', ') : '…'}</p>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-sm font-semibold text-slate-900">{draft.subject || '(no subject)'}</p>
          {draft.message && <p className="whitespace-pre-wrap text-sm text-slate-600">{draft.message}</p>}
          <div className={`rounded-xl p-3 ${template.accent.soft}`}>
            <p className={`text-xs font-semibold ${template.accent.text}`}>{template.name}</p>
            <p className="text-xs text-slate-600">
              {periodText} · {built.rows} rows
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <MailIcon size={16} className="text-slate-400" />
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-700">{built.filename}</span>
            <span className="text-[11px] text-slate-400">{formatBytes(new Blob([built.content]).size)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Google Sheets                                                       */
/* ------------------------------------------------------------------ */

export interface SheetsDraft {
  name: string;
  mode: 'new' | 'append';
  live: boolean;
}

export function SheetsPanel({
  draft,
  onChange,
  built,
  template,
  account,
}: {
  draft: SheetsDraft;
  onChange: (d: SheetsDraft) => void;
  built: BuiltExport;
  template: TemplateDef;
  account: string;
}) {
  const nameId = useId();
  const cols = built.preview.columns.slice(0, 5);
  const letters = 'ABCDEFGH';
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,18rem)_1fr]">
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          Connected as <span className="font-medium text-slate-700">{account}</span>
        </p>
        <fieldset>
          <legend className="label">Destination</legend>
          <div className="grid grid-cols-2 gap-2">
            {(['new', 'append'] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={draft.mode === m}
                onClick={() => onChange({ ...draft, mode: m })}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
                  draft.mode === m ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="block text-sm font-semibold">{m === 'new' ? 'New tab' : 'Replace tab'}</span>
                {m === 'new' ? 'Adds a dated tab' : 'Overwrites existing'}
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor={nameId} className="label">
            Spreadsheet
          </label>
          <input id={nameId} className="input" value={draft.name} onChange={(e) => onChange({ ...draft, name: e.target.value })} />
        </div>
        <div className="rounded-xl border border-slate-200 p-3">
          <Toggle
            checked={draft.live}
            onChange={(live) => onChange({ ...draft, live })}
            label="Live sync"
            description="Push changes to this sheet automatically whenever you add or edit an expense."
          />
        </div>
      </div>

      {/* Spreadsheet-style mockup */}
      <div aria-label="Spreadsheet preview" className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-[11px] shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
          <span className="h-5 w-4 rounded-sm bg-emerald-600" aria-hidden="true" />
          <span className="truncate text-sm font-medium text-slate-800">{draft.name || 'Untitled spreadsheet'}</span>
          {draft.live && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              <ZapIcon size={11} /> Live
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono">
            <thead>
              <tr className="bg-slate-50 text-slate-400">
                <th className="w-8 border border-slate-200 font-normal" />
                {cols.map((_, i) => (
                  <th key={i} className="border border-slate-200 px-2 py-0.5 font-normal">
                    {letters[i]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-200 bg-slate-50 text-center text-slate-400">1</td>
                {cols.map((c) => (
                  <td key={c} className="whitespace-nowrap border border-slate-200 bg-emerald-50 px-2 py-1 font-sans font-semibold text-emerald-900">
                    {c}
                  </td>
                ))}
              </tr>
              {built.preview.rows.slice(0, 5).map((r, i) => (
                <tr key={i}>
                  <td className="border border-slate-200 bg-slate-50 text-center text-slate-400">{i + 2}</td>
                  {r.slice(0, 5).map((v, j) => (
                    <td key={j} className="max-w-[8rem] truncate whitespace-nowrap border border-slate-200 px-2 py-1 text-slate-700">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-px border-t border-slate-200 bg-slate-100 px-2 pt-1">
          <span className="rounded-t-md bg-white px-3 py-1 font-medium text-emerald-700 shadow-sm">
            {draft.mode === 'new' ? `${template.name} · ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : template.name}
          </span>
          <span className="px-3 py-1 text-slate-400">Summary</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cloud storage (Drive / Dropbox / OneDrive)                          */
/* ------------------------------------------------------------------ */

export function StoragePanel({
  folder,
  onFolder,
  built,
  account,
  serviceName,
}: {
  folder: string;
  onFolder: (v: string) => void;
  built: BuiltExport;
  account: string;
  serviceName: string;
}) {
  const id = useId();
  const crumbs = folder.split('/').filter(Boolean);
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Connected as <span className="font-medium text-slate-700">{account}</span>
      </p>
      <div>
        <label htmlFor={id} className="label">
          Folder
        </label>
        <input id={id} className="input font-mono" value={folder} onChange={(e) => onFolder(e.target.value)} spellCheck={false} />
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <nav aria-label="Folder path" className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{serviceName}</span>
          {crumbs.map((c) => (
            <span key={c} className="flex items-center gap-1">
              <span className="text-slate-300">/</span>
              {c}
            </span>
          ))}
        </nav>
        <ul className="divide-y divide-slate-100 text-sm">
          <li className="flex items-center gap-3 bg-indigo-50/50 px-3 py-2.5">
            <span className="rounded bg-indigo-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-indigo-700">NEW</span>
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-800">{built.filename}</span>
            <span className="text-xs text-slate-400">{formatBytes(new Blob([built.content]).size)}</span>
          </li>
          <li className="px-3 py-2.5 text-xs text-slate-400">Earlier exports in this folder are kept — nothing is overwritten.</li>
        </ul>
      </div>
    </div>
  );
}
