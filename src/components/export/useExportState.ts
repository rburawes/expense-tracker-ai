'use client';

import { useMemo, useReducer } from 'react';
import {
  countByCategoryInRange,
  resolveFilename,
  selectExpenses,
  suggestFilename,
  summarize,
  validateDateRange,
  type ExportFormatId,
  type ExportOptions,
} from '@/lib/export';
import { CATEGORIES, type Category, type Expense } from '@/lib/types';

interface State {
  options: ExportOptions;
  /** Once the user edits the filename we stop auto-suggesting one. */
  filenameTouched: boolean;
}

type Action =
  | { type: 'format'; format: ExportFormatId }
  | { type: 'range'; startDate: string; endDate: string }
  | { type: 'start'; value: string }
  | { type: 'end'; value: string }
  | { type: 'toggleCategory'; category: Category }
  | { type: 'setCategories'; categories: Category[] }
  | { type: 'filename'; value: string }
  | { type: 'resetFilename' };

function withSuggestedName(state: State, startDate: string, endDate: string): State {
  const options = { ...state.options, startDate, endDate };
  if (!state.filenameTouched) options.filename = suggestFilename(startDate, endDate);
  return { ...state, options };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'format':
      return { ...state, options: { ...state.options, format: action.format } };
    case 'range':
      return withSuggestedName(state, action.startDate, action.endDate);
    case 'start':
      return withSuggestedName(state, action.value, state.options.endDate);
    case 'end':
      return withSuggestedName(state, state.options.startDate, action.value);
    case 'toggleCategory': {
      const set = new Set(state.options.categories);
      if (set.has(action.category)) set.delete(action.category);
      else set.add(action.category);
      // Keep canonical order so filenames / reports are stable.
      return { ...state, options: { ...state.options, categories: CATEGORIES.filter((c) => set.has(c)) } };
    }
    case 'setCategories':
      return { ...state, options: { ...state.options, categories: action.categories } };
    case 'filename':
      return { filenameTouched: true, options: { ...state.options, filename: action.value } };
    case 'resetFilename':
      return {
        filenameTouched: false,
        options: {
          ...state.options,
          filename: suggestFilename(state.options.startDate, state.options.endDate),
        },
      };
  }
}

function init(format: ExportFormatId): State {
  return {
    filenameTouched: false,
    options: {
      format,
      startDate: '',
      endDate: '',
      categories: [...CATEGORIES],
      filename: suggestFilename('', ''),
    },
  };
}

export function useExportState(expenses: Expense[], initialFormat: ExportFormatId) {
  const [state, dispatch] = useReducer(reducer, initialFormat, init);
  const { options } = state;

  const rangeError = validateDateRange(options.startDate, options.endDate);

  const rows = useMemo(
    () => (rangeError ? [] : selectExpenses(expenses, options)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expenses, options.startDate, options.endDate, options.categories, rangeError],
  );
  const summary = useMemo(() => summarize(rows), [rows]);
  const categoryCounts = useMemo(
    () => countByCategoryInRange(expenses, rangeError ? '' : options.startDate, rangeError ? '' : options.endDate),
    [expenses, options.startDate, options.endDate, rangeError],
  );
  const finalFilename = resolveFilename(options);

  const blockingReason: string | null = rangeError
    ? 'Start date must be on or before the end date.'
    : options.categories.length === 0
      ? 'Select at least one category.'
      : rows.length === 0
        ? 'No expenses match these filters.'
        : null;

  return {
    options,
    filenameTouched: state.filenameTouched,
    dispatch,
    rows,
    summary,
    categoryCounts,
    finalFilename,
    rangeError,
    blockingReason,
    canExport: blockingReason === null,
  };
}

export type ExportState = ReturnType<typeof useExportState>;
