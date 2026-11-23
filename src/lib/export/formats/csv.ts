import { expensesToCsv } from '@/lib/csv';
import type { ExportFormat } from '../types';

export const csvFormat: ExportFormat = {
  id: 'csv',
  label: 'CSV',
  extension: 'csv',
  mimeType: 'text/csv;charset=utf-8',
  description: 'Spreadsheet-friendly. Opens in Excel, Numbers and Google Sheets.',
  async build({ rows, currency }) {
    // BOM so Excel detects UTF-8 (currency symbols, accents).
    return new Blob(['﻿', expensesToCsv(rows, currency)], { type: this.mimeType });
  },
};
