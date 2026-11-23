'use client';

import { useState } from 'react';
import { useExpenses } from '@/components/providers/ExpenseProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DatabaseIcon, DownloadIcon, SparkleIcon, TrashIcon } from '@/components/ui/Icons';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { StorageErrorBanner } from '@/components/ui/StorageErrorBanner';
import { sumAmounts } from '@/lib/analytics';
import { CURRENCIES } from '@/lib/currencies';
import { downloadCsv, expensesToCsv } from '@/lib/csv';
import { sortExpenses } from '@/lib/filters';
import { formatCurrency, todayISO } from '@/lib/format';

export function SettingsView() {
  const { expenses, isLoaded, currency, setCurrency, addSampleData, clearAll, loadError } = useExpenses();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function exportAll() {
    downloadCsv(expensesToCsv(sortExpenses(expenses, 'date-desc'), currency), `expenses-all-${todayISO()}.csv`);
    toast({ type: 'success', title: 'Export ready', description: `${expenses.length} expenses exported to CSV.` });
  }

  function loadSamples() {
    try {
      const n = addSampleData();
      toast({ type: 'success', title: 'Sample data loaded', description: `${n} example expenses added.` });
    } catch (err) {
      toast({ type: 'error', title: 'Could not load sample data', description: (err as Error).message });
    }
  }

  function deleteAll() {
    try {
      clearAll();
      toast({ type: 'success', title: 'All data deleted' });
    } catch (err) {
      toast({ type: 'error', title: 'Could not delete data', description: (err as Error).message });
    }
    setConfirmOpen(false);
  }

  return (
    <>
      <PageHeader title="Settings" description="Preferences and data management." />
      <StorageErrorBanner />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <section className="card p-5 sm:p-6" aria-labelledby="prefs-title">
          <h2 id="prefs-title" className="text-base font-semibold text-slate-900">
            Preferences
          </h2>
          <p className="mt-1 text-sm text-slate-500">Choose how amounts are displayed.</p>
          <div className="mt-5">
            <label htmlFor="currency" className="label">
              Currency
            </label>
            {isLoaded ? (
              <select
                id="currency"
                className="input"
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  toast({ type: 'success', title: 'Currency updated', description: formatCurrency(1234.5, e.target.value) });
                }}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <Skeleton className="h-11 w-full" />
            )}
            <p className="mt-2 text-xs text-slate-500">
              Changes the display symbol only — amounts are not converted.
            </p>
          </div>
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-800">Keyboard shortcut</p>
            <p className="mt-1">
              Press{' '}
              <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-700">N</kbd>{' '}
              anywhere to add a new expense.
            </p>
          </div>
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="data-title">
          <h2 id="data-title" className="text-base font-semibold text-slate-900">
            Your data
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Everything is stored privately in this browser using localStorage.
          </p>

          <div className="mt-5 flex items-center gap-4 rounded-xl border border-slate-200 p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <DatabaseIcon size={22} />
            </span>
            {isLoaded ? (
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
                </p>
                <p className="text-sm text-slate-500">{formatCurrency(sumAmounts(expenses), currency)} total</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2">
            <button type="button" className="btn btn-secondary w-full justify-start" onClick={exportAll} disabled={!expenses.length}>
              <DownloadIcon size={18} />
              Export all expenses (CSV)
            </button>
            <button type="button" className="btn btn-secondary w-full justify-start" onClick={loadSamples} disabled={!isLoaded}>
              <SparkleIcon size={18} />
              Add sample data
            </button>
            <button
              type="button"
              className="btn w-full justify-start border border-rose-200 bg-white text-rose-600 hover:bg-rose-50"
              onClick={() => setConfirmOpen(true)}
              disabled={!isLoaded || (!expenses.length && !loadError)}
            >
              <TrashIcon size={18} />
              Delete all data
            </button>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete all expenses?"
        message={`This permanently removes ${expenses.length} ${
          expenses.length === 1 ? 'expense' : 'expenses'
        } from this browser. Export a CSV first if you want a backup.`}
        confirmLabel="Delete everything"
        onConfirm={deleteAll}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
