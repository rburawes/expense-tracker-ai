'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useExpenseDialog } from '@/components/providers/ExpenseDialogProvider';
import { useExpenses } from '@/components/providers/ExpenseProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { EmptyState } from '@/components/ui/EmptyState';
import { DownloadIcon, PlusIcon, ReceiptIcon, SearchIcon } from '@/components/ui/Icons';
import { PageHeader } from '@/components/ui/PageHeader';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { StorageErrorBanner } from '@/components/ui/StorageErrorBanner';
import { sumAmounts } from '@/lib/analytics';
import { downloadCsv, expensesToCsv } from '@/lib/csv';
import { DEFAULT_FILTERS, filterExpenses, hasActiveFilters, sortExpenses } from '@/lib/filters';
import { formatCurrency, todayISO } from '@/lib/format';
import { isCategory, type Expense, type ExpenseFilters, type SortKey } from '@/lib/types';
import { ExpenseListItem, ExpenseTableRow } from './ExpenseRow';
import { FilterBar } from './FilterBar';

const PAGE_SIZE = 25;

export function ExpensesView() {
  const { expenses, isLoaded, currency, deleteExpense, restoreExpense } = useExpenses();
  const { openCreate, openEdit } = useExpenseDialog();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<ExpenseFilters>(() => {
    const category = searchParams.get('category');
    return { ...DEFAULT_FILTERS, category: isCategory(category) ? category : 'All' };
  });
  const [sort, setSort] = useState<SortKey>('date-desc');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(
    () => sortExpenses(filterExpenses(expenses, filters), sort),
    [expenses, filters, sort],
  );
  const filteredTotal = useMemo(() => sumAmounts(filtered), [filtered]);
  const shown = filtered.slice(0, visible);
  const filtering = hasActiveFilters(filters);

  useEffect(() => setVisible(PAGE_SIZE), [filters, sort]);

  function handleDelete(expense: Expense) {
    try {
      deleteExpense(expense.id);
      toast({
        type: 'success',
        title: 'Expense deleted',
        description: `${expense.description} · ${formatCurrency(expense.amount, currency)}`,
        action: {
          label: 'Undo',
          onClick: () => {
            try {
              restoreExpense(expense);
              toast({ type: 'info', title: 'Expense restored' });
            } catch (err) {
              toast({ type: 'error', title: 'Could not restore', description: (err as Error).message });
            }
          },
        },
      });
    } catch (err) {
      toast({ type: 'error', title: 'Could not delete expense', description: (err as Error).message });
    }
  }

  function handleExport() {
    if (filtered.length === 0) {
      toast({ type: 'error', title: 'Nothing to export', description: 'No expenses match the current filters.' });
      return;
    }
    try {
      downloadCsv(expensesToCsv(filtered, currency), `expenses-${todayISO()}.csv`);
      toast({
        type: 'success',
        title: 'Export ready',
        description: `${filtered.length} ${filtered.length === 1 ? 'expense' : 'expenses'} exported to CSV.`,
      });
    } catch {
      toast({ type: 'error', title: 'Export failed', description: 'Your browser blocked the download.' });
    }
  }

  const actions = (
    <>
      <button type="button" className="btn btn-secondary" onClick={handleExport} disabled={!isLoaded || !expenses.length}>
        <DownloadIcon size={18} />
        Export CSV
      </button>
      <button type="button" className="btn btn-primary" onClick={openCreate}>
        <PlusIcon size={18} strokeWidth={2.25} />
        Add expense
      </button>
    </>
  );

  return (
    <>
      <PageHeader title="Expenses" description="Search, filter and manage every expense." actions={actions} />
      <StorageErrorBanner />

      {!isLoaded ? (
        <ListSkeleton />
      ) : expenses.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ReceiptIcon size={28} />}
            title="No expenses yet"
            description="Expenses you add will appear here. You can search, filter, edit and export them."
          >
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <PlusIcon size={18} strokeWidth={2.25} />
              Add expense
            </button>
          </EmptyState>
        </div>
      ) : (
        <>
          <FilterBar filters={filters} onChange={setFilters} sort={sort} onSortChange={setSort} />

          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 px-1 text-sm" aria-live="polite">
            <p className="text-slate-500">
              {filtering ? (
                <>
                  Showing <span className="font-semibold text-slate-900">{filtered.length}</span> of {expenses.length}{' '}
                  expenses
                </>
              ) : (
                <>
                  <span className="font-semibold text-slate-900">{expenses.length}</span>{' '}
                  {expenses.length === 1 ? 'expense' : 'expenses'}
                </>
              )}
            </p>
            <p className="text-slate-500">
              Total{' '}
              <span className="text-base font-bold tabular-nums text-slate-900">
                {formatCurrency(filteredTotal, currency)}
              </span>
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="card">
              <EmptyState
                compact
                icon={<SearchIcon size={26} />}
                title="No matching expenses"
                description="Try a different search term, category or date range."
              >
                <button type="button" className="btn btn-secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>
                  Clear filters
                </button>
              </EmptyState>
            </div>
          ) : (
            <div className="card overflow-hidden">
              {/* Mobile list */}
              <ul className="divide-y divide-slate-100 md:hidden" role="list">
                {shown.map((e) => (
                  <ExpenseListItem key={e.id} expense={e} currency={currency} onEdit={openEdit} onDelete={handleDelete} />
                ))}
              </ul>

              {/* Desktop table */}
              <table className="hidden w-full md:table">
                <thead className="border-b border-slate-200 bg-slate-50/80">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-5 py-3">Date</th>
                    <th scope="col" className="w-full px-5 py-3">Description</th>
                    <th scope="col" className="px-5 py-3">Category</th>
                    <th scope="col" className="px-5 py-3 text-right">Amount</th>
                    <th scope="col" className="px-3 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shown.map((e) => (
                    <ExpenseTableRow key={e.id} expense={e} currency={currency} onEdit={openEdit} onDelete={handleDelete} />
                  ))}
                </tbody>
              </table>

              {filtered.length > visible && (
                <div className="border-t border-slate-100 p-3 text-center">
                  <button type="button" className="btn btn-ghost" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    Show more ({filtered.length - visible} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
