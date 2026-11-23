'use client';

import { CategoryGlyph } from '@/components/ui/CategoryIcon';
import { CATEGORY_META } from '@/lib/categories';
import { CATEGORIES, type Category } from '@/lib/types';

export function CategorySelector({
  selected,
  counts,
  onToggle,
  onSetAll,
  disabled,
}: {
  selected: Category[];
  counts: Record<Category, number>;
  onToggle: (category: Category) => void;
  onSetAll: (categories: Category[]) => void;
  disabled?: boolean;
}) {
  const selectedSet = new Set(selected);
  const allSelected = selected.length === CATEGORIES.length;

  return (
    <fieldset disabled={disabled}>
      <div className="mb-1.5 flex items-center justify-between">
        <legend className="text-sm font-medium text-slate-700">
          Categories{' '}
          <span className="font-normal text-slate-400">
            ({selected.length}/{CATEGORIES.length})
          </span>
        </legend>
        <div className="flex gap-1 text-xs font-medium">
          <button
            type="button"
            className="rounded px-1.5 py-0.5 text-indigo-600 hover:bg-indigo-50 disabled:text-slate-300 disabled:hover:bg-transparent"
            onClick={() => onSetAll([...CATEGORIES])}
            disabled={allSelected}
          >
            Select all
          </button>
          <button
            type="button"
            className="rounded px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent"
            onClick={() => onSetAll([])}
            disabled={selected.length === 0}
          >
            Clear
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {CATEGORIES.map((c) => {
          const on = selectedSet.has(c);
          const count = counts[c];
          return (
            <button
              key={c}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => onToggle(c)}
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-sm transition ${
                on ? CATEGORY_META[c].selected : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
              } ${count === 0 && !on ? 'opacity-60' : ''}`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  on ? 'border-current bg-current' : 'border-slate-300 bg-white'
                }`}
                aria-hidden="true"
              >
                {on && (
                  <svg viewBox="0 0 16 16" className="h-3 w-3 text-white" fill="none">
                    <path d="m4 8.5 2.5 2.5L12 5.5" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <CategoryGlyph category={c} size={16} />
              <span className="min-w-0 flex-1 truncate font-medium">{c}</span>
              <span className="tabular-nums text-xs opacity-70">{count}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
