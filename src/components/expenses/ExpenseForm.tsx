'use client';

import { useState, type FormEvent } from 'react';
import { CategoryGlyph } from '@/components/ui/CategoryIcon';
import { AlertCircleIcon } from '@/components/ui/Icons';
import { Spinner } from '@/components/ui/Spinner';
import { CATEGORY_META } from '@/lib/categories';
import { addDays, getCurrencySymbol, todayISO } from '@/lib/format';
import { CATEGORIES, type Expense, type ExpenseInput } from '@/lib/types';
import {
  DESCRIPTION_MAX,
  FIELD_ORDER,
  toExpenseInput,
  validateExpense,
  validateExpenseField,
  type ExpenseField,
  type ExpenseFormErrors,
  type ExpenseFormValues,
} from '@/lib/validation';

interface ExpenseFormProps {
  initial?: Expense;
  currency: string;
  /** Return false to signal a failed save (keeps the form open and enabled). */
  onSubmit: (input: ExpenseInput) => boolean;
  onCancel: () => void;
}

function initialValues(expense?: Expense): ExpenseFormValues {
  if (expense) {
    return {
      amount: expense.amount.toFixed(2),
      date: expense.date,
      category: expense.category,
      description: expense.description,
    };
  }
  return { amount: '', date: todayISO(), category: '', description: '' };
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="field-error">
      <AlertCircleIcon size={14} />
      {message}
    </p>
  );
}

export function ExpenseForm({ initial, currency, onSubmit, onCancel }: ExpenseFormProps) {
  const [values, setValues] = useState<ExpenseFormValues>(() => initialValues(initial));
  const [errors, setErrors] = useState<ExpenseFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<ExpenseField, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const today = todayISO();
  const symbol = getCurrencySymbol(currency);
  const isEdit = Boolean(initial);

  function update<K extends ExpenseField>(field: K, value: ExpenseFormValues[K]) {
    const next = { ...values, [field]: value };
    setValues(next);
    // Re-validate live once a field has been visited or already shows an error.
    if (touched[field] || errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateExpenseField(field, next) }));
    }
  }

  function handleBlur(field: ExpenseField) {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateExpenseField(field, values) }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const found = validateExpense(values);
    setErrors(found);
    setTouched({ amount: true, date: true, category: true, description: true });
    const firstInvalid = FIELD_ORDER.find((f) => found[f]);
    if (firstInvalid) {
      document.getElementById(`expense-${firstInvalid}`)?.focus();
      return;
    }
    setSubmitting(true);
    const ok = onSubmit(toExpenseInput(values));
    if (!ok) setSubmitting(false);
  }

  const descLength = values.description.trim().length;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Amount */}
      <div>
        <label htmlFor="expense-amount" className="label">
          Amount
        </label>
        <div
          className={`flex items-center rounded-xl border bg-white shadow-sm transition focus-within:ring-4 ${
            errors.amount
              ? 'border-rose-400 focus-within:border-rose-500 focus-within:ring-rose-500/10'
              : 'border-slate-200 focus-within:border-indigo-500 focus-within:ring-indigo-500/10'
          }`}
        >
          <span className="select-none pl-4 text-lg font-medium text-slate-400">{symbol}</span>
          <input
            id="expense-amount"
            data-autofocus
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={values.amount}
            onChange={(e) => update('amount', e.target.value)}
            onBlur={() => handleBlur('amount')}
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={errors.amount ? 'expense-amount-error' : undefined}
            className="w-full rounded-xl border-0 bg-transparent px-2 py-3 text-2xl font-semibold tracking-tight text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-0"
          />
        </div>
        <FieldError id="expense-amount-error" message={errors.amount} />
      </div>

      {/* Date */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="expense-date" className="label">
            Date
          </label>
          <div className="mb-1.5 flex gap-1">
            {[
              { label: 'Today', value: today },
              { label: 'Yesterday', value: addDays(today, -1) },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => update('date', opt.value)}
                className={`rounded-md px-2 py-0.5 text-xs font-medium transition ${
                  values.date === opt.value
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <input
          id="expense-date"
          type="date"
          max={today}
          value={values.date}
          onChange={(e) => update('date', e.target.value)}
          onBlur={() => handleBlur('date')}
          aria-invalid={Boolean(errors.date)}
          aria-describedby={errors.date ? 'expense-date-error' : undefined}
          className={`input ${errors.date ? 'input-error' : ''}`}
        />
        <FieldError id="expense-date-error" message={errors.date} />
      </div>

      {/* Category */}
      <fieldset>
        <legend className="label">Category</legend>
        <div
          id="expense-category"
          tabIndex={-1}
          role="radiogroup"
          aria-invalid={Boolean(errors.category)}
          aria-describedby={errors.category ? 'expense-category-error' : undefined}
          className="grid grid-cols-3 gap-2 focus:outline-none"
        >
          {CATEGORIES.map((category) => {
            const selected = values.category === category;
            return (
              <button
                key={category}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  update('category', category);
                  setTouched((t) => ({ ...t, category: true }));
                  setErrors((prev) => ({ ...prev, category: undefined }));
                }}
                className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  selected
                    ? CATEGORY_META[category].selected
                    : `bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 ${
                        errors.category ? 'border-rose-300' : 'border-slate-200'
                      }`
                }`}
              >
                <CategoryGlyph category={category} size={20} />
                {category}
              </button>
            );
          })}
        </div>
        <FieldError id="expense-category-error" message={errors.category} />
      </fieldset>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="expense-description" className="label">
            Description
          </label>
          <span
            className={`mb-1.5 text-xs tabular-nums ${
              descLength > DESCRIPTION_MAX ? 'text-rose-600' : 'text-slate-400'
            }`}
          >
            {descLength}/{DESCRIPTION_MAX}
          </span>
        </div>
        <input
          id="expense-description"
          type="text"
          autoComplete="off"
          placeholder="e.g. Lunch with the team"
          maxLength={DESCRIPTION_MAX + 20}
          value={values.description}
          onChange={(e) => update('description', e.target.value)}
          onBlur={() => handleBlur('description')}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'expense-description-error' : undefined}
          className={`input ${errors.description ? 'input-error' : ''}`}
        />
        <FieldError id="expense-description-error" message={errors.description} />
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary min-w-[140px]" disabled={submitting}>
          {submitting && <Spinner />}
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add expense'}
        </button>
      </div>
    </form>
  );
}
