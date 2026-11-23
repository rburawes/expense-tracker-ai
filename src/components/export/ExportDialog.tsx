'use client';

import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react';
import { useExpenses } from '@/components/providers/ExpenseProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { AlertCircleIcon, DownloadIcon } from '@/components/ui/Icons';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { getFormat, runExport, type ExportFormatId } from '@/lib/export';
import { CategorySelector } from './CategorySelector';
import { DateRangeSection } from './DateRangeSection';
import { ExportPreview } from './ExportPreview';
import { ExportSummaryPanel } from './ExportSummaryPanel';
import { FilenameField } from './FilenameField';
import { FormatPicker } from './FormatPicker';
import { useExportState } from './useExportState';

type Status = { phase: 'idle' } | { phase: 'working'; label: string } | { phase: 'error'; message: string };

const MIN_WORKING_MS = 450;
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

export function ExportDialog({
  initialFormat,
  onClose,
  onExported,
}: {
  initialFormat: ExportFormatId;
  onClose: () => void;
  onExported: (format: ExportFormatId) => void;
}) {
  const { expenses, currency } = useExpenses();
  const { toast } = useToast();
  const state = useExportState(expenses, initialFormat);
  const { options, dispatch } = state;
  const format = getFormat(options.format);

  const [status, setStatus] = useState<Status>({ phase: 'idle' });
  const working = status.phase === 'working';

  // Keep typing/toggling snappy on large datasets; the preview catches up.
  const deferredRows = useDeferredValue(state.rows);
  const previewStale = deferredRows !== state.rows;

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handleExport = useCallback(async () => {
    if (!state.canExport || working) return;
    const started = performance.now();
    try {
      setStatus({ phase: 'working', label: `Preparing ${state.rows.length.toLocaleString()} records…` });
      await nextFrame();
      setStatus({ phase: 'working', label: `Generating ${format.label}…` });
      await nextFrame();
      const result = await runExport(expenses, options, currency);
      const elapsed = performance.now() - started;
      if (elapsed < MIN_WORKING_MS) await sleep(MIN_WORKING_MS - elapsed);
      onExported(options.format);
      toast({
        type: 'success',
        title: 'Export complete',
        description: `${result.count.toLocaleString()} records saved to ${result.filename} (${formatBytes(result.bytes)}).`,
      });
      onClose();
    } catch (err) {
      if (mounted.current) {
        setStatus({ phase: 'error', message: (err as Error).message || 'Something went wrong while exporting.' });
      }
    }
  }, [state.canExport, state.rows.length, working, format.label, expenses, options, currency, onExported, toast, onClose]);

  // Power-user shortcut: ⌘/Ctrl + Enter exports from anywhere in the dialog.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void handleExport();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleExport]);

  // Clear a previous error as soon as the user changes something.
  useEffect(() => {
    setStatus((s) => (s.phase === 'error' ? { phase: 'idle' } : s));
  }, [options]);

  const footer = (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-h-[1.25rem] text-xs" aria-live="polite">
        {status.phase === 'error' ? (
          <span className="flex items-center gap-1.5 font-medium text-rose-600">
            <AlertCircleIcon size={14} />
            {status.message}
          </span>
        ) : working ? (
          <span className="flex items-center gap-2 font-medium text-indigo-600">
            <Spinner className="h-3.5 w-3.5" />
            {status.label}
          </span>
        ) : state.blockingReason ? (
          <span className="text-amber-700">{state.blockingReason}</span>
        ) : (
          <span className="text-slate-500">
            <span className="font-semibold text-slate-700">{state.summary.count.toLocaleString()}</span>{' '}
            {state.summary.count === 1 ? 'record' : 'records'} ready ·{' '}
            <span className="font-mono">{state.finalFilename}</span>
            <kbd className="ml-2 hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 font-sans text-[10px] text-slate-400 sm:inline">
              {isMac() ? '⌘' : 'Ctrl'} ↵
            </kbd>
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn btn-secondary flex-1 sm:flex-none" onClick={onClose} disabled={working}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary min-w-[9.5rem] flex-1 sm:flex-none"
          onClick={() => void handleExport()}
          disabled={!state.canExport || working}
          aria-busy={working}
        >
          {working ? <Spinner /> : <DownloadIcon size={18} />}
          {working ? 'Exporting…' : `Export ${format.label}`}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      open
      size="xl"
      onClose={working ? () => {} : onClose}
      title="Export expenses"
      description="Choose a format, narrow down what to include, and review before downloading."
      footer={footer}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="space-y-5">
          <FormatPicker
            value={options.format}
            onChange={(f) => dispatch({ type: 'format', format: f })}
            disabled={working}
          />
          <DateRangeSection
            startDate={options.startDate}
            endDate={options.endDate}
            error={state.rangeError ? 'Start date must be on or before the end date.' : null}
            onRange={(startDate, endDate) => dispatch({ type: 'range', startDate, endDate })}
            onStart={(value) => dispatch({ type: 'start', value })}
            onEnd={(value) => dispatch({ type: 'end', value })}
            disabled={working}
          />
          <CategorySelector
            selected={options.categories}
            counts={state.categoryCounts}
            onToggle={(category) => dispatch({ type: 'toggleCategory', category })}
            onSetAll={(categories) => dispatch({ type: 'setCategories', categories })}
            disabled={working}
          />
          <FilenameField
            value={options.filename}
            extension={format.extension}
            finalFilename={state.finalFilename}
            touched={state.filenameTouched}
            onChange={(value) => dispatch({ type: 'filename', value })}
            onReset={() => dispatch({ type: 'resetFilename' })}
            disabled={working}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <ExportSummaryPanel summary={state.summary} totalAvailable={expenses.length} currency={currency} />
          <ExportPreview
            rows={deferredRows}
            currency={currency}
            stale={previewStale}
            emptyMessage={state.blockingReason ?? 'Try widening the date range or selecting more categories.'}
          />
        </div>
      </div>
    </Modal>
  );
}
