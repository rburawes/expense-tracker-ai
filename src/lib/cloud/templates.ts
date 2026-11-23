import { sumAmounts, totalsByCategory } from '@/lib/analytics';
import { escapeCell } from '@/lib/csv';
import { addDays, formatMonth, monthKey, todayISO } from '@/lib/format';
import { CATEGORIES, type Expense } from '@/lib/types';
import type { TemplateId } from './types';

export type PeriodKind = 'year' | 'month' | 'all';

export interface BuiltExport {
  filename: string;
  mimeType: string;
  content: string;
  rows: number;
  preview: { columns: string[]; rows: string[][] };
}

export interface TemplateDef {
  id: TemplateId;
  name: string;
  tagline: string;
  description: string;
  bestFor: string[];
  periodKind: PeriodKind;
  format: 'CSV' | 'JSON';
  /** Tailwind classes for the template's accent. */
  accent: { soft: string; text: string; ring: string; gradient: string };
  icon: string;
  build: (expenses: Expense[], period: string, currency: string) => BuiltExport;
}

/* ------------------------------------------------------------------ */
/* Period helpers                                                      */
/* ------------------------------------------------------------------ */

export function defaultPeriod(kind: PeriodKind, ref = new Date()): string {
  if (kind === 'year') return String(ref.getFullYear());
  if (kind === 'month') return monthKey(ref);
  return 'all';
}

export function filterByPeriod(expenses: Expense[], period: string): Expense[] {
  if (period === 'all') return expenses;
  return expenses.filter((e) => e.date.startsWith(period));
}

export function periodLabel(period: string): string {
  if (period === 'all') return 'All time';
  if (/^\d{4}$/.test(period)) return `Tax year ${period}`;
  return formatMonth(period, 'long');
}

/** Years / months that actually contain data, newest first (always includes the current one). */
export function availablePeriods(expenses: Expense[], kind: PeriodKind): string[] {
  if (kind === 'all') return ['all'];
  const set = new Set<string>([defaultPeriod(kind)]);
  for (const e of expenses) set.add(kind === 'year' ? e.date.slice(0, 4) : e.date.slice(0, 7));
  return [...set].sort().reverse();
}

function prevMonth(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return monthKey(new Date(y, m - 2, 1));
}

/* ------------------------------------------------------------------ */
/* CSV helpers                                                         */
/* ------------------------------------------------------------------ */

const NUMERIC = /^-?\d+(\.\d+)?%?$/;

/** Plain numbers/percentages (e.g. "-12.5%") can't be formulas, so skip the injection guard for them. */
function cell(v: string | number): string {
  if (typeof v === 'number' || NUMERIC.test(v)) return String(v);
  return escapeCell(v);
}
function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map(cell).join(',')).join('\r\n');
}
const money = (n: number) => n.toFixed(2);
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function csvResult(filename: string, header: string[], body: (string | number)[][], extra: (string | number)[][] = []) {
  return {
    filename,
    mimeType: 'text/csv;charset=utf-8',
    content: toCsv([header, ...body, ...extra]),
    rows: body.length,
    preview: { columns: header, rows: body.slice(0, 5).map((r) => r.map(String)) },
  };
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

export const TEMPLATES: readonly TemplateDef[] = [
  {
    id: 'tax-report',
    name: 'Tax Report',
    tagline: 'Year-end, accountant-ready',
    description: 'Every transaction for the tax year with running totals and a category subtotal block.',
    bestFor: ['Accountants', 'Tax filing'],
    periodKind: 'year',
    format: 'CSV',
    accent: {
      soft: 'bg-emerald-50',
      text: 'text-emerald-700',
      ring: 'ring-emerald-500/30',
      gradient: 'from-emerald-500 to-teal-600',
    },
    icon: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6m-6 4h3',
    build(expenses, period, currency) {
      const rows = filterByPeriod(expenses, period).sort((a, b) => a.date.localeCompare(b.date));
      let running = 0;
      const body = rows.map((e) => {
        running += Math.round(e.amount * 100);
        return [e.date, e.category, e.description, money(e.amount), money(running / 100), currency];
      });
      const subtotals = totalsByCategory(rows).map((c) => ['', `Subtotal: ${c.category}`, `${c.count} items`, money(c.total), '', currency]);
      return csvResult(
        `tax-report-${period}.csv`,
        ['Date', 'Category', 'Description', 'Amount', 'Running total', 'Currency'],
        body,
        rows.length ? [[], ...subtotals, ['', 'TOTAL', `${rows.length} items`, money(sumAmounts(rows)), '', currency]] : [],
      );
    },
  },
  {
    id: 'monthly-summary',
    name: 'Monthly Summary',
    tagline: 'One month at a glance',
    description: 'Category totals for the month compared with the month before — great for budgeting check-ins.',
    bestFor: ['Budget reviews', 'Partners'],
    periodKind: 'month',
    format: 'CSV',
    accent: {
      soft: 'bg-indigo-50',
      text: 'text-indigo-700',
      ring: 'ring-indigo-500/30',
      gradient: 'from-indigo-500 to-violet-600',
    },
    icon: 'M4 5h16v15H4V5Zm0 5h16M9 3v4m6-4v4',
    build(expenses, period, currency) {
      const current = filterByPeriod(expenses, period);
      const previous = filterByPeriod(expenses, prevMonth(period));
      const total = sumAmounts(current);
      const body = CATEGORIES.map((c) => {
        const now = sumAmounts(current.filter((e) => e.category === c));
        const before = sumAmounts(previous.filter((e) => e.category === c));
        const change = before > 0 ? pct((now - before) / before) : now > 0 ? 'new' : '—';
        return [c, current.filter((e) => e.category === c).length, money(now), total ? pct(now / total) : '0.0%', money(before), change, currency];
      }).filter((r) => r[1] !== 0 || r[4] !== '0.00');
      return csvResult(
        `monthly-summary-${period}.csv`,
        ['Category', 'Transactions', 'Total', 'Share', 'Previous month', 'Change', 'Currency'],
        body,
        [['TOTAL', current.length, money(total), '100.0%', money(sumAmounts(previous)), '', currency]],
      );
    },
  },
  {
    id: 'category-analysis',
    name: 'Category Analysis',
    tagline: 'Where the money really goes',
    description: 'Per-category averages, biggest purchases and 30-day momentum across your whole history.',
    bestFor: ['Spotting trends', 'Cutting costs'],
    periodKind: 'all',
    format: 'CSV',
    accent: {
      soft: 'bg-amber-50',
      text: 'text-amber-700',
      ring: 'ring-amber-500/30',
      gradient: 'from-amber-500 to-orange-600',
    },
    icon: 'M12 3v9h9a9 9 0 1 1-9-9Zm3-.5A9 9 0 0 1 21.5 9H15V2.5Z',
    build(expenses, _period, currency) {
      const today = todayISO();
      const last30 = addDays(today, -29);
      const prior30 = addDays(today, -59);
      const grand = sumAmounts(expenses);
      const body = totalsByCategory(expenses).map((c) => {
        const items = expenses.filter((e) => e.category === c.category);
        const recent = sumAmounts(items.filter((e) => e.date >= last30));
        const before = sumAmounts(items.filter((e) => e.date >= prior30 && e.date < last30));
        const trend = before > 0 ? pct((recent - before) / before) : recent > 0 ? 'new' : '—';
        return [
          c.category,
          c.count,
          money(c.total),
          money(c.total / c.count),
          money(Math.max(...items.map((e) => e.amount))),
          grand ? pct(c.total / grand) : '0.0%',
          money(recent),
          trend,
          currency,
        ];
      });
      return csvResult(
        `category-analysis-${today}.csv`,
        ['Category', 'Transactions', 'Total', 'Average', 'Largest', 'Share', 'Last 30 days', '30-day trend', 'Currency'],
        body,
      );
    },
  },
  {
    id: 'full-backup',
    name: 'Full Backup',
    tagline: 'Complete, restorable archive',
    description: 'Every expense with all metadata as structured JSON. Ideal for scheduled backups.',
    bestFor: ['Backups', 'Developers'],
    periodKind: 'all',
    format: 'JSON',
    accent: {
      soft: 'bg-sky-50',
      text: 'text-sky-700',
      ring: 'ring-sky-500/30',
      gradient: 'from-sky-500 to-blue-600',
    },
    icon: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
    build(expenses, _period, currency) {
      const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date));
      const payload = {
        app: 'spendwise',
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        currency,
        count: sorted.length,
        total: sumAmounts(sorted),
        expenses: sorted,
      };
      return {
        filename: `spendwise-backup-${todayISO()}.json`,
        mimeType: 'application/json',
        content: JSON.stringify(payload, null, 2),
        rows: sorted.length,
        preview: {
          columns: ['Date', 'Category', 'Description', 'Amount'],
          rows: sorted
            .slice(-5)
            .reverse()
            .map((e) => [e.date, e.category, e.description, money(e.amount)]),
        },
      };
    },
  },
];

export function getTemplate(id: TemplateId): TemplateDef {
  const t = TEMPLATES.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown template ${id}`);
  return t;
}
