'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/format';
import type { Expense, ExpenseInput } from '@/lib/types';
import { useExpenses } from './ExpenseProvider';
import { useToast } from './ToastProvider';

type DialogState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; expense: Expense };

interface ExpenseDialogContextValue {
  openCreate: () => void;
  openEdit: (expense: Expense) => void;
}

const ExpenseDialogContext = createContext<ExpenseDialogContextValue | null>(null);

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export function ExpenseDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>({ mode: 'closed' });
  const [formKey, setFormKey] = useState(0);
  const { addExpense, updateExpense, currency } = useExpenses();
  const { toast } = useToast();

  const openCreate = useCallback(() => {
    setFormKey((k) => k + 1);
    setState({ mode: 'create' });
  }, []);
  const openEdit = useCallback((expense: Expense) => {
    setFormKey((k) => k + 1);
    setState({ mode: 'edit', expense });
  }, []);
  const close = useCallback(() => setState({ mode: 'closed' }), []);

  // Keyboard shortcut: press "N" anywhere to add an expense.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 'n' || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target) || document.querySelector('[role="dialog"]')) return;
      event.preventDefault();
      openCreate();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openCreate]);

  const handleSubmit = useCallback(
    (input: ExpenseInput) => {
      try {
        if (state.mode === 'edit') {
          updateExpense(state.expense.id, input);
          toast({ type: 'success', title: 'Changes saved', description: input.description });
        } else {
          addExpense(input);
          toast({
            type: 'success',
            title: 'Expense added',
            description: `${formatCurrency(input.amount, currency)} · ${input.category} · ${input.description}`,
          });
        }
        close();
        return true;
      } catch (err) {
        toast({
          type: 'error',
          title: 'Could not save expense',
          description: err instanceof Error ? err.message : 'Please try again.',
        });
        return false;
      }
    },
    [state, addExpense, updateExpense, toast, close, currency],
  );

  const value = useMemo(() => ({ openCreate, openEdit }), [openCreate, openEdit]);

  return (
    <ExpenseDialogContext.Provider value={value}>
      {children}
      <Modal
        open={state.mode !== 'closed'}
        onClose={close}
        title={state.mode === 'edit' ? 'Edit expense' : 'Add expense'}
        description={
          state.mode === 'edit' ? 'Update the details of this expense.' : 'Record a new purchase or payment.'
        }
      >
        {state.mode !== 'closed' && (
          <ExpenseForm
            key={formKey}
            initial={state.mode === 'edit' ? state.expense : undefined}
            currency={currency}
            onSubmit={handleSubmit}
            onCancel={close}
          />
        )}
      </Modal>
    </ExpenseDialogContext.Provider>
  );
}

export function useExpenseDialog(): ExpenseDialogContextValue {
  const ctx = useContext(ExpenseDialogContext);
  if (!ctx) throw new Error('useExpenseDialog must be used inside <ExpenseDialogProvider>');
  return ctx;
}
