'use client';

import { useId, useState } from 'react';
import { useCloudExport } from '@/components/providers/CloudExportProvider';
import { CheckIcon, ShieldIcon, WalletIcon } from '@/components/ui/Icons';
import { Spinner } from '@/components/ui/Spinner';
import { DESTINATIONS, isEmail } from '@/lib/cloud/destinations';
import type { IntegrationId } from '@/lib/cloud/types';
import { DestinationGlyph } from './DestinationGlyph';

/**
 * Simulated OAuth consent screen. Mirrors a real provider flow
 * (consent → redirect → token) so the UX can be validated before
 * real credentials exist. Nothing leaves the browser.
 */
export function ConnectPanel({ id, onConnected }: { id: IntegrationId; onConnected?: () => void }) {
  const { connect } = useCloudExport();
  const meta = DESTINATIONS[id];
  const inputId = useId();
  const [account, setAccount] = useState('');
  const [phase, setPhase] = useState<'consent' | 'authorizing' | 'done'>('consent');
  const [touched, setTouched] = useState(false);
  const valid = isEmail(account);

  async function authorize() {
    setTouched(true);
    if (!valid) return;
    setPhase('authorizing');
    await new Promise((r) => setTimeout(r, 1400));
    connect(id, account.trim());
    setPhase('done');
    await new Promise((r) => setTimeout(r, 700));
    onConnected?.();
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="flex items-center justify-center gap-3 bg-gradient-to-b from-slate-50 to-white px-4 py-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm">
          <WalletIcon size={24} />
        </span>
        <span className="flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${phase === 'authorizing' ? 'animate-pulse bg-indigo-400' : phase === 'done' ? 'bg-emerald-500' : 'bg-slate-300'}`}
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </span>
        <DestinationGlyph id={id} size="lg" />
      </div>

      <div className="space-y-4 px-5 pb-5 pt-1">
        {phase === 'done' ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center" role="status">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckIcon size={20} strokeWidth={2.25} />
            </span>
            <p className="font-semibold text-slate-900">{meta.name} connected</p>
            <p className="text-sm text-slate-500">{account}</p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="font-semibold text-slate-900">Connect Spendwise to {meta.name}</p>
              <p className="mt-0.5 text-sm text-slate-500">Spendwise will be able to:</p>
            </div>
            <ul className="space-y-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
              {meta.scopes?.map((s) => (
                <li key={s} className="flex items-start gap-2">
                  <CheckIcon size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  {s}
                </li>
              ))}
            </ul>
            <div>
              <label htmlFor={inputId} className="label">
                {meta.name} account
              </label>
              <input
                id={inputId}
                type="email"
                className={`input ${touched && !valid ? 'input-error' : ''}`}
                placeholder="name@example.com"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void authorize()}
                disabled={phase === 'authorizing'}
                autoComplete="email"
                data-autofocus
              />
              {touched && !valid && <p className="field-error">Enter the email address of the account to connect.</p>}
            </div>
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={() => void authorize()}
              disabled={phase === 'authorizing'}
            >
              {phase === 'authorizing' ? (
                <>
                  <Spinner /> Waiting for {meta.name}…
                </>
              ) : (
                `Authorize ${meta.name}`
              )}
            </button>
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400">
              <ShieldIcon size={14} className="mt-px shrink-0" />
              Demo integration: the authorization is simulated and no data leaves your browser. You can disconnect at any
              time.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
