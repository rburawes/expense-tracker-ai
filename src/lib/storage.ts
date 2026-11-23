import { isValidISODate } from './format';
import { isSupportedCurrency } from './currencies';
import { isCategory, type Expense } from './types';

export const STORAGE_KEYS = {
  expenses: 'spendwise.expenses.v1',
  settings: 'spendwise.settings.v1',
} as const;

export interface Settings {
  currency: string;
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

export function loadSettings(): Settings | null {
  if (!storageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return isSupportedCurrency(parsed.currency) ? { currency: parsed.currency } : null;
  } catch {
    return null;
  }
}

export function saveSettings(settings: Settings): void {
  if (!storageAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  } catch {
    /* settings are non-critical */
  }
}
