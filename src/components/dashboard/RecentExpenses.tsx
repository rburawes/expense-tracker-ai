'use client';

import Link from 'next/link';
import { ExpenseListItem } from '@/components/expenses/ExpenseRow';
import { useExpenseDialog } from '@/components/providers/ExpenseDialogProvider';
import { ArrowRightIcon } from '@/components/ui/Icons';
import { sortExpenses } from '@/lib/filters';
import type { Expense } from '@/lib/types';

export function RecentExpenses({ expenses, currency }: { expenses: Expense[]; currency: string }) {
  const { openEdit } = useExpenseDialog();
  const recent = sortExpenses(expenses, 'date-desc').slice(0, 6);

  return (
    <section className="card overflow-hidden" aria-labelledby="recent-title">
      <div className="flex items-center justify-between px-4 pb-2 pt-4 sm:px-5 sm:pt-5">
        <h2 id="recent-title" className="text-base font-semibold text-slate-900">
          Recent expenses
        </h2>
        <Link
          href="/expenses"
          className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          View all
          <ArrowRightIcon size={16} />
        </Link>
      </div>
      <ul className="divide-y divide-slate-100" role="list">
        {recent.map((e) => (
          <ExpenseListItem key={e.id} expense={e} currency={currency} onEdit={openEdit} />
        ))}
      </ul>
    </section>
  );
}
