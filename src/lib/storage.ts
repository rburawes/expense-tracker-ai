import { isValidISODate } from './format';
import { isSupportedCurrency } from './currencies';
import { isValidBudget } from './insights';
import { isCategory, type Expense } from './types';

export const STORAGE_KEYS = {
  expenses: 'spendwise.expenses.v1',
  settings: 'spendwise.settings.v1',
} as const;

export interface Settings {
  currency: string;
  /** Monthly spending budget, or null when none is set. */
  monthlyBudget: number | null;
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

function isExpense(value: unknown): value is Expense {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.date === 'string' &&
    isValidISODate(v.date) &&
    typeof v.amount === 'number' &&
    Number.isFinite(v.amount) &&
    v.amount > 0 &&
    isCategory(v.category) &&
    typeof v.description === 'string'
  );
}

function storageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

/**
 * Reads expenses from localStorage. Invalid individual records are skipped;
 * a completely unreadable payload throws so the UI can surface it.
 */
export function loadExpenses(): Expense[] {
  if (!storageAvailable()) {
    throw new StorageError('Local storage is not available in this browser.');
  }
  const raw = window.localStorage.getItem(STORAGE_KEYS.expenses);
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new StorageError('Saved expense data could not be read and may be corrupted.');
  }
  if (!Array.isArray(parsed)) {
    throw new StorageError('Saved expense data has an unexpected format.');
  }
  return parsed.filter(isExpense).map((e) => ({
    ...e,
    createdAt: e.createdAt ?? new Date().toISOString(),
    updatedAt: e.updatedAt ?? e.createdAt ?? new Date().toISOString(),
  }));
}

export function saveExpenses(expenses: Expense[]): void {
  if (!storageAvailable()) {
    throw new StorageError('Local storage is not available in this browser.');
  }
  try {
    window.localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses));
  } catch (err) {
    const quota =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    throw new StorageError(
      quota
        ? 'Browser storage is full. Export and delete some expenses, then try again.'
        : 'Your changes could not be saved to browser storage.',
    );
  }
}

/** Reads settings, keeping only the fields that are valid. */
export function loadSettings(): Partial<Settings> {
  if (!storageAvailable()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result: Partial<Settings> = {};
    if (isSupportedCurrency(parsed.currency)) result.currency = parsed.currency;
    if (isValidBudget(parsed.monthlyBudget)) result.monthlyBudget = parsed.monthlyBudget;
    else if (parsed.monthlyBudget === null) result.monthlyBudget = null;
    return result;
  } catch {
    return {};
  }
}

/** Merges `patch` into the stored settings. Settings are non-critical, so failures are ignored. */
export function saveSettings(patch: Partial<Settings>): void {
  if (!storageAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify({ ...loadSettings(), ...patch }));
  } catch {
    /* settings are non-critical */
  }
}
