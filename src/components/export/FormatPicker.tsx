'use client';

import { useId } from 'react';
import { EXPORT_FORMATS, type ExportFormatId } from '@/lib/export';
import { FORMAT_ICONS } from './formatIcons';

export function FormatPicker({
  value,
  onChange,
  disabled,
}: {
  value: ExportFormatId;
  onChange: (format: ExportFormatId) => void;
  disabled?: boolean;
}) {
  const name = useId();
  return (
    <fieldset disabled={disabled}>
      <legend className="label">Format</legend>
      <div className="grid grid-cols-3 gap-2">
        {EXPORT_FORMATS.map((f) => {
          const Icon = FORMAT_ICONS[f.id];
          const selected = value === f.id;
          return (
            <label
              key={f.id}
              className={`group relative flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500/40 ${
                selected
                  ? 'border-indigo-500 bg-indigo-50/70 text-indigo-700 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
              title={f.description}
            >
              <input
                type="radio"
                name={name}
                value={f.id}
                checked={selected}
                onChange={() => onChange(f.id)}
                className="sr-only"
              />
              <Icon size={22} />
              <span className="text-sm font-semibold">{f.label}</span>
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">{EXPORT_FORMATS.find((f) => f.id === value)?.description}</p>
    </fieldset>
  );
}
