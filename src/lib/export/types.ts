import type { Category, Expense } from '@/lib/types';

export type ExportFormatId = 'csv' | 'json' | 'pdf';

/** Everything the user can configure in the export dialog. */
export interface ExportOptions {
  format: ExportFormatId;
  /** Inclusive YYYY-MM-DD bounds; empty string means unbounded. */
  startDate: string;
  endDate: string;
  /** Categories to include. An empty list means "nothing selected" (exports nothing). */
  categories: Category[];
  /** Filename without extension, as typed by the user. */
  filename: string;
}

export interface CategoryTotal {
  category: Category;
  count: number;
  total: number;
}

export interface ExportSummary {
  count: number;
  total: number;
  /** Earliest / latest expense date in the selection, or null when empty. */
  firstDate: string | null;
  lastDate: string | null;
  byCategory: CategoryTotal[];
}

/** Context passed to every format builder. */
export interface ExportContext {
  rows: Expense[];
  summary: ExportSummary;
  options: ExportOptions;
  currency: string;
  generatedAt: Date;
}

/**
 * A pluggable export format. Builders are async so heavy formats (PDF) can
 * lazy-load their dependencies without bloating the main bundle.
 */
export interface ExportFormat {
  id: ExportFormatId;
  label: string;
  extension: string;
  mimeType: string;
  /** One-line description shown in the format picker. */
  description: string;
  build: (ctx: ExportContext) => Promise<Blob>;
}
