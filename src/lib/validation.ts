import { isValidISODate, todayISO } from './format';
import { isCategory, type Category, type ExpenseInput } from './types';

export interface ExpenseFormValues {
  amount: string;
  date: string;
  category: Category | '';
  description: string;
}

export type ExpenseField = keyof ExpenseFormValues;
export type ExpenseFormErrors = Partial<Record<ExpenseField, string>>;

export const AMOUNT_MAX = 10_000_000;
export const DESCRIPTION_MIN = 2;
export const DESCRIPTION_MAX = 100;
export const FIELD_ORDER: ExpenseField[] = ['amount', 'date', 'category', 'description'];

export function normalizeAmount(raw: string): string {
  return raw.replace(/[,\s]/g, '');
}

export function validateExpenseField(
  field: ExpenseField,
  values: ExpenseFormValues,
): string | undefined {
  switch (field) {
    case 'amount': {
      const raw = normalizeAmount(values.amount);
      if (!raw) return 'Enter an amount.';
      if (!/^(\d+(\.\d*)?|\.\d+)$/.test(raw)) return 'Amount must be a number, e.g. 12.50.';
      if (/\.\d{3,}$/.test(raw)) return 'Use at most two decimal places.';
      const n = Number(raw);
      if (n <= 0) return 'Amount must be greater than zero.';
      if (n > AMOUNT_MAX) return `Amount can't exceed ${AMOUNT_MAX.toLocaleString()}.`;
      return undefined;
    }
    case 'date': {
      if (!values.date) return 'Choose a date.';
      if (!isValidISODate(values.date)) return 'Enter a valid date.';
      if (values.date > todayISO()) return "Date can't be in the future.";
      if (values.date < '1970-01-01') return 'Date is too far in the past.';
      return undefined;
    }
    case 'category':
      return isCategory(values.category) ? undefined : 'Pick a category.';
    case 'description': {
      const text = values.description.trim();
      if (!text) return 'Add a short description.';
      if (text.length < DESCRIPTION_MIN) return `Use at least ${DESCRIPTION_MIN} characters.`;
      if (text.length > DESCRIPTION_MAX) return `Keep it under ${DESCRIPTION_MAX} characters.`;
      return undefined;
    }
  }
}

export function validateExpense(values: ExpenseFormValues): ExpenseFormErrors {
  const errors: ExpenseFormErrors = {};
  for (const field of FIELD_ORDER) {
    const message = validateExpenseField(field, values);
    if (message) errors[field] = message;
  }
  return errors;
}

/** Call only after validateExpense returns no errors. */
export function toExpenseInput(values: ExpenseFormValues): ExpenseInput {
  return {
    amount: Math.round(Number(normalizeAmount(values.amount)) * 100) / 100,
    date: values.date,
    category: values.category as Category,
    description: values.description.trim().replace(/\s+/g, ' '),
  };
}
