import type { Expense } from '@/lib/types';
import { buildFilename } from './filename';
import { csvFormat } from './formats/csv';
import { jsonFormat } from './formats/json';
import { pdfFormat } from './formats/pdf';
import { selectExpenses, summarize } from './selection';
import type { ExportFormat, ExportFormatId, ExportOptions } from './types';

export * from './filename';
export * from './selection';
export * from './types';

export const EXPORT_FORMATS: readonly ExportFormat[] = [csvFormat, jsonFormat, pdfFormat];

const ALL_EXTENSIONS = EXPORT_FORMATS.map((f) => f.extension);

export function getFormat(id: ExportFormatId): ExportFormat {
  const format = EXPORT_FORMATS.find((f) => f.id === id);
  if (!format) throw new Error(`Unknown export format: ${id}`);
  return format;
}

export function resolveFilename(options: Pick<ExportOptions, 'filename' | 'format'>): string {
  return buildFilename(options.filename, getFormat(options.format).extension, ALL_EXTENSIONS);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface ExportResult {
  filename: string;
  count: number;
  bytes: number;
}

/** Builds the file for the given options and triggers a browser download. */
export async function runExport(
  expenses: Expense[],
  options: ExportOptions,
  currency: string,
): Promise<ExportResult> {
  const rows = selectExpenses(expenses, options);
  if (rows.length === 0) throw new Error('No expenses match the selected filters.');
  const format = getFormat(options.format);
  const blob = await format.build({
    rows,
    summary: summarize(rows),
    options,
    currency,
    generatedAt: new Date(),
  });
  const filename = resolveFilename(options);
  downloadBlob(blob, filename);
  return { filename, count: rows.length, bytes: blob.size };
}
