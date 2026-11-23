'use client';

import { useId } from 'react';
import { AlertCircleIcon } from '@/components/ui/Icons';
import { QUICK_RANGES, getQuickRange } from '@/lib/filters';

function getPresets() {
  // Computed per render so "This month" etc. stay correct across midnight.
  return [
    { value: 'all', label: 'All time', range: { startDate: '', endDate: '' } },
    ...QUICK_RANGES.map((r) => ({ value: r.value, label: r.label, range: getQuickRange(r.value) })),
  ];
}

export function DateRangeSection({
  startDate,
  endDate,
  error,
  onRange,
  onStart,
  onEnd,
  disabled,
}: {
  startDate: string;
  endDate: string;
  error: string | null;
  onRange: (startDate: string, endDate: string) => void;
  onStart: (value: string) => void;
  onEnd: (value: string) => void;
  disabled?: boolean;
}) {
  const startId = useId();
  const endId = useId();
  const errorId = useId();

  return (
    <fieldset disabled={disabled}>
      <legend className="label">Date range</legend>
      <div className="-mx-1 mb-3 flex flex-wrap gap-1.5 px-1">
        {getPresets().map((p) => {
          const active = p.range.startDate === startDate && p.range.endDate === endDate;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => onRange(p.range.startDate, p.range.endDate)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition ${
                active
                  ? 'bg-indigo-600 text-white ring-indigo-600'
                  : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={startId} className="mb-1 block text-xs font-medium text-slate-500">
            From
          </label>
          <input
            id={startId}
            type="date"
            className={`input ${error ? 'input-error' : ''}`}
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => onStart(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
        </div>
        <div>
          <label htmlFor={endId} className="mb-1 block text-xs font-medium text-slate-500">
            To
          </label>
          <input
            id={endId}
            type="date"
            className={`input ${error ? 'input-error' : ''}`}
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => onEnd(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
        </div>
      </div>
      {error && (
        <p id={errorId} className="field-error" role="alert">
          <AlertCircleIcon size={14} />
          {error}
        </p>
      )}
    </fieldset>
  );
}
