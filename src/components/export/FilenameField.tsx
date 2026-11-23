'use client';

import { useId } from 'react';

export function FilenameField({
  value,
  extension,
  finalFilename,
  touched,
  onChange,
  onReset,
  disabled,
}: {
  value: string;
  extension: string;
  finalFilename: string;
  touched: boolean;
  onChange: (value: string) => void;
  onReset: () => void;
  disabled?: boolean;
}) {
  const id = useId();
  const hintId = useId();
  const typed = `${value.trim()}.${extension}`;
  const adjusted = finalFilename !== typed;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          Filename
        </label>
        {touched && (
          <button
            type="button"
            onClick={onReset}
            disabled={disabled}
            className="rounded px-1.5 py-0.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Use suggested
          </button>
        )}
      </div>
      <div className="flex rounded-xl shadow-sm focus-within:ring-4 focus-within:ring-indigo-500/10">
        <input
          id={id}
          type="text"
          className="input min-w-0 flex-1 rounded-r-none shadow-none focus:ring-0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          maxLength={120}
          disabled={disabled}
          aria-describedby={hintId}
        />
        <span className="inline-flex items-center rounded-r-xl border border-l-0 border-slate-200 bg-slate-50 px-3 font-mono text-sm text-slate-500">
          .{extension}
        </span>
      </div>
      <p id={hintId} className="mt-1.5 truncate text-xs text-slate-500">
        {adjusted ? (
          <>
            Will be saved as <span className="font-mono text-slate-700">{finalFilename}</span>
          </>
        ) : (
          'Invalid characters are replaced automatically.'
        )}
      </p>
    </div>
  );
}
