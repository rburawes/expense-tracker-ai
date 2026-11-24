'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { detectDefaultCurrency } from '@/lib/currencies';
import { createId } from '@/lib/id';
import { generateSampleExpenses } from '@/lib/sampleData';
import {
  STORAGE_KEYS,
  loadExpenses,
  loadSettings,
  saveExpenses,
  saveSettings,
} from '@/lib/storage';
import type { Expense, ExpenseInput } from '@/lib/types';

interface ExpenseContextValue {
  expenses: Expense[];
  isLoaded: boolean;
  loadError: string | null;
  currency: string;
  setCurrency: (currency: string) => void;
  monthlyBudget: number | null;
  setMonthlyBudget: (budget: number | null) => void;
  /** All mutators throw a StorageError if the change could not be persisted. */
  addExpense: (input: ExpenseInput) => Expense;
  updateExpense: (id: string, input: ExpenseInput) => Expense;
  deleteExpense: (id: string) => Expense | undefined;
  restoreExpense: (expense: Expense) => void;
  addSampleData: () => number;
  clearAll: () => void;
}

const ExpenseContext = createContext<ExpenseContextValue | null>(null);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currency, setCurrencyState] = useState('USD');
  const [monthlyBudget, setMonthlyBudgetState] = useState<number | null>(null);
  const expensesRef = useRef<Expense[]>([]);

  const readFromStorage = useCallback(() => {
    try {
      const data = loadExpenses();
      expensesRef.current = data;
      setExpenses(data);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load saved expenses.');
    }
  }, []);

  useEffect(() => {
    // localStorage only exists in the browser, so saved data is loaded after mount
    // to keep the first client render identical to the server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    readFromStorage();
    const settings = loadSettings();
    setCurrencyState(settings.currency ?? detectDefaultCurrency());
    setMonthlyBudgetState(settings.monthlyBudget ?? null);
    setIsLoaded(true);

    // Keep multiple open tabs in sync.
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEYS.expenses) readFromStorage();
      if (event.key === STORAGE_KEYS.settings) {
        const s = loadSettings();
        if (s.currency) setCurrencyState(s.currency);
        setMonthlyBudgetState(s.monthlyBudget ?? null);
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [readFromStorage]);

  /** Persist first, then update state — so the UI never shows unsaved data. */
  const commit = useCallback((next: Expense[]) => {
    saveExpenses(next);
    expensesRef.current = next;
    setExpenses(next);
    setLoadError(null);
  }, []);

  const addExpense = useCallback(
    (input: ExpenseInput) => {
      const now = new Date().toISOString();
      const expense: Expense = { ...input, id: createId(), createdAt: now, updatedAt: now };
      commit([expense, ...expensesRef.current]);
      return expense;
    },
    [commit],
  );

  const updateExpense = useCallback(
    (id: string, input: ExpenseInput) => {
      const existing = expensesRef.current.find((e) => e.id === id);
      if (!existing) throw new Error('That expense no longer exists.');
      const updated: Expense = { ...existing, ...input, updatedAt: new Date().toISOString() };
      commit(expensesRef.current.map((e) => (e.id === id ? updated : e)));
      return updated;
    },
    [commit],
  );

  const deleteExpense = useCallback(
    (id: string) => {
      const existing = expensesRef.current.find((e) => e.id === id);
      if (existing) commit(expensesRef.current.filter((e) => e.id !== id));
      return existing;
    },
    [commit],
  );

  const restoreExpense = useCallback(
    (expense: Expense) => {
      if (expensesRef.current.some((e) => e.id === expense.id)) return;
      commit([expense, ...expensesRef.current]);
    },
    [commit],
  );

  const addSampleData = useCallback(() => {
    const base = Date.now();
    const samples: Expense[] = generateSampleExpenses().map((input, i) => {
      const ts = new Date(base - i * 1000).toISOString();
      return { ...input, id: createId(), createdAt: ts, updatedAt: ts };
    });
    commit([...samples, ...expensesRef.current]);
    return samples.length;
  }, [commit]);

  const clearAll = useCallback(() => commit([]), [commit]);

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    saveSettings({ currency: code });
  }, []);

  const setMonthlyBudget = useCallback((budget: number | null) => {
    setMonthlyBudgetState(budget);
    saveSettings({ monthlyBudget: budget });
  }, []);

  const value = useMemo<ExpenseContextValue>(
    () => ({
      expenses,
      isLoaded,
      loadError,
      currency,
      setCurrency,
      monthlyBudget,
      setMonthlyBudget,
      addExpense,
      updateExpense,
      deleteExpense,
      restoreExpense,
      addSampleData,
      clearAll,
    }),
    [
      expenses,
      isLoaded,
      loadError,
      currency,
      setCurrency,
      monthlyBudget,
      setMonthlyBudget,
      addExpense,
      updateExpense,
      deleteExpense,
      restoreExpense,
      addSampleData,
      clearAll,
    ],
  );

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenses(): ExpenseContextValue {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error('useExpenses must be used inside <ExpenseProvider>');
  return ctx;
}
