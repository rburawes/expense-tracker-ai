'use client';

import { CategoryBadge, CategoryIcon } from '@/components/ui/CategoryIcon';
import { PencilIcon, TrashIcon } from '@/components/ui/Icons';
import { formatCurrency, formatDate, formatRelativeDate } from '@/lib/format';
import type { Expense } from '@/lib/types';

interface RowProps {
  expense: Expense;
  currency: string;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}

function Actions({ expense, onEdit, onDelete }: Omit<RowProps, 'currency'>) {
  if (!onEdit && !onDelete) return null;
  return (
    <div className="flex items-center gap-0.5">
      {onEdit && (
        <button
          type="button"
          className="btn-icon"
          onClick={() => onEdit(expense)}
          aria-label={`Edit ${expense.description}`}
          title="Edit"
        >
          <PencilIcon size={16} />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          className="btn-icon hover:bg-rose-50 hover:text-rose-600"
          onClick={() => onDelete(expense)}
          aria-label={`Delete ${expense.description}`}
          title="Delete"
        >
          <TrashIcon size={16} />
        </button>
      )}
    </div>
  );
}

/** Compact list row (mobile + dashboard). */
export function ExpenseListItem({ expense, currency, onEdit, onDelete }: RowProps) {
  return (
    <li className="group flex items-center gap-3 px-4 py-3 sm:px-5">
      <CategoryIcon category={expense.category} />
      <button
        type="button"
        className="min-w-0 flex-1 text-left disabled:cursor-default"
        onClick={() => onEdit?.(expense)}
        disabled={!onEdit}
      >
        <p className="truncate text-sm font-medium text-slate-900">{expense.description}</p>
        <p className="text-xs text-slate-500">
          {expense.category} · {formatRelativeDate(expense.date)}
        </p>
      </button>
      <p className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
        {formatCurrency(expense.amount, currency)}
      </p>
      {onDelete && (
        <div className="-mr-2 shrink-0">
          <Actions expense={expense} onDelete={onDelete} />
        </div>
      )}
    </li>
  );
}

/** Desktop table row. */
export function ExpenseTableRow({ expense, currency, onEdit, onDelete }: RowProps) {
  return (
    <tr className="group transition hover:bg-slate-50/70">
      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600">{formatDate(expense.date)}</td>
      <td className="px-5 py-3.5 text-sm">
        <span className="line-clamp-1 font-medium text-slate-900">{expense.description}</span>
      </td>
      <td className="whitespace-nowrap px-5 py-3.5">
        <CategoryBadge category={expense.category} />
      </td>
      <td className="whitespace-nowrap px-5 py-3.5 text-right text-sm font-semibold tabular-nums text-slate-900">
        {formatCurrency(expense.amount, currency)}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-right">
        <div className="flex justify-end opacity-60 transition group-hover:opacity-100 group-focus-within:opacity-100">
          <Actions expense={expense} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </td>
    </tr>
  );
}
