'use client';

import { useMemo } from 'react';
import { useExpenseDialog } from '@/components/providers/ExpenseDialogProvider';
import { useExpenses } from '@/components/providers/ExpenseProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { EmptyState } from '@/components/ui/EmptyState';
import { DownloadIcon, PlusIcon, SparkleIcon, TrendIcon } from '@/components/ui/Icons';
import { PageHeader } from '@/components/ui/PageHeader';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { StorageErrorBanner } from '@/components/ui/StorageErrorBanner';
import { getSummary, monthlyTotals } from '@/lib/analytics';
import { downloadCsv, expensesToBasicCsv } from '@/lib/csv';
import { sortExpenses } from '@/lib/filters';
import { todayISO } from '@/lib/format';
import { CategoryBreakdown } from './CategoryBreakdown';
import { MonthlyTrendChart } from './MonthlyTrendChart';
import { RecentExpenses } from './RecentExpenses';
import { SummaryCards } from './SummaryCards';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardView() {
  const { expenses, isLoaded, currency, addSampleData } = useExpenses();
  const { openCreate } = useExpenseDialog();
  const { toast } = useToast();

  const summary = useMemo(() => getSummary(expenses), [expenses]);
  const monthly = useMemo(() => monthlyTotals(expenses, 6), [expenses]);

  function loadSamples() {
    try {
      const n = addSampleData();
      toast({ type: 'success', title: 'Sample data loaded', description: `${n} example expenses added.` });
    } catch (err) {
      toast({ type: 'error', title: 'Could not load sample data', description: (err as Error).message });
    }
  }

  function exportData() {
    downloadCsv(expensesToBasicCsv(sortExpenses(expenses, 'date-desc')), `expenses-${todayISO()}.csv`);
  }

  const header = (
    <PageHeader
      title="Dashboard"
      description={isLoaded ? `${greeting()} — here's where your money is going.` : 'Your spending at a glance.'}
      actions={
        isLoaded && expenses.length > 0 ? (
          <button type="button" className="btn btn-secondary" onClick={exportData}>
            <DownloadIcon size={18} />
            Export Data
          </button>
        ) : undefined
      }
    />
  );

  if (!isLoaded) {
    return (
      <>
        {header}
        <DashboardSkeleton />
      </>
    );
  }

  return (
    <>
      {header}
      <StorageErrorBanner />

      {expenses.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<TrendIcon size={28} />}
            title="Start tracking your spending"
            description="Add your first expense to see summaries, trends and category breakdowns here. Or explore with sample data."
          >
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <PlusIcon size={18} strokeWidth={2.25} />
              Add your first expense
            </button>
            <button type="button" className="btn btn-secondary" onClick={loadSamples}>
              <SparkleIcon size={18} />
              Load sample data
            </button>
          </EmptyState>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <SummaryCards summary={summary} currency={currency} />
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <MonthlyTrendChart data={monthly} currency={currency} />
            </div>
            <div className="lg:col-span-2">
              <CategoryBreakdown expenses={expenses} currency={currency} />
            </div>
          </div>
          <RecentExpenses expenses={expenses} currency={currency} />
        </div>
      )}
    </>
  );
}
