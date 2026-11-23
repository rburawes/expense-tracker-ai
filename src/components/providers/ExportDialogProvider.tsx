'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ExportDialog } from '@/components/export/ExportDialog';
import { EXPORT_FORMATS, type ExportFormatId } from '@/lib/export';
import { useExpenses } from './ExpenseProvider';

const LAST_FORMAT_KEY = 'expense-tracker:last-export-format';

interface ExportDialogContextValue {
  openExport: () => void;
  canExport: boolean;
}

const ExportDialogContext = createContext<ExportDialogContextValue | null>(null);

function readLastFormat(): ExportFormatId {
  try {
    const v = window.localStorage.getItem(LAST_FORMAT_KEY);
    if (v && EXPORT_FORMATS.some((f) => f.id === v)) return v as ExportFormatId;
  } catch {
    /* storage unavailable — fall through */
  }
  return 'csv';
}

function writeLastFormat(format: ExportFormatId) {
  try {
    window.localStorage.setItem(LAST_FORMAT_KEY, format);
  } catch {
    /* non-essential convenience */
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export function ExportDialogProvider({ children }: { children: ReactNode }) {
  const { expenses, isLoaded } = useExpenses();
  const [session, setSession] = useState<{ id: number; format: ExportFormatId } | null>(null);
  const canExport = isLoaded && expenses.length > 0;

  const openExport = useCallback(() => {
    if (!canExport) return;
    // A new id remounts the dialog so every opening starts from fresh defaults.
    setSession((s) => ({ id: (s?.id ?? 0) + 1, format: readLastFormat() }));
  }, [canExport]);
  const close = useCallback(() => setSession((s) => (s ? null : s)), []);

  // Keyboard shortcut: press "E" anywhere to open the export dialog.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 'e' || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target) || document.querySelector('[role="dialog"]')) return;
      event.preventDefault();
      openExport();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openExport]);

  const value = useMemo(() => ({ openExport, canExport }), [openExport, canExport]);

  return (
    <ExportDialogContext.Provider value={value}>
      {children}
      {session && (
        <ExportDialog key={session.id} initialFormat={session.format} onClose={close} onExported={writeLastFormat} />
      )}
    </ExportDialogContext.Provider>
  );
}

export function useExportDialog(): ExportDialogContextValue {
  const ctx = useContext(ExportDialogContext);
  if (!ctx) throw new Error('useExportDialog must be used within an ExportDialogProvider');
  return ctx;
}
