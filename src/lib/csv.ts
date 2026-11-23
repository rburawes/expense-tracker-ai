import type { Expense } from './types';

function escapeCell(value: string): string {
  // Neutralise spreadsheet formula injection.
  let safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  if (/[",\r\n]/.test(safe)) safe = `"${safe.replace(/"/g, '""')}"`;
  return safe;
}

export function expensesToCsv(expenses: Expense[], currency: string): string {
  const header = ['Date', 'Category', 'Description', 'Amount', 'Currency'];
  const rows = expenses.map((e) => [
    e.date,
    e.category,
    escapeCell(e.description),
    e.amount.toFixed(2),
    currency,
  ]);
  return [header, ...rows].map((row) => row.join(',')).join('\r\n');
}

/** Minimal export used by the dashboard button: Date, Category, Amount, Description. */
export function expensesToBasicCsv(expenses: Expense[]): string {
  const header = ['Date', 'Category', 'Amount', 'Description'];
  const rows = expenses.map((e) => [e.date, e.category, e.amount.toFixed(2), escapeCell(e.description)]);
  return [header, ...rows].map((row) => row.join(',')).join('\r\n');
}

export function downloadCsv(content: string, filename: string): void {
  // BOM so Excel detects UTF-8 (currency symbols, accents).
  const blob = new Blob(['﻿', content], { type: 'text/csv;charset=utf-8;' });
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
