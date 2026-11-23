'use client';

import type { ReactNode } from 'react';
import { ExpenseDialogProvider } from './ExpenseDialogProvider';
import { ExpenseProvider } from './ExpenseProvider';
import { ExportDialogProvider } from './ExportDialogProvider';
import { ToastProvider } from './ToastProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ExpenseProvider>
        <ExpenseDialogProvider>
          <ExportDialogProvider>{children}</ExportDialogProvider>
        </ExpenseDialogProvider>
      </ExpenseProvider>
    </ToastProvider>
  );
}
