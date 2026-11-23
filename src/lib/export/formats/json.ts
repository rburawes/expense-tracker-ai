import type { ExportFormat } from '../types';

export const jsonFormat: ExportFormat = {
  id: 'json',
  label: 'JSON',
  extension: 'json',
  mimeType: 'application/json',
  description: 'Structured data with metadata. Ideal for developers and integrations.',
  async build({ rows, summary, options, currency, generatedAt }) {
    const payload = {
      exportedAt: generatedAt.toISOString(),
      currency,
      filters: {
        startDate: options.startDate || null,
        endDate: options.endDate || null,
        categories: options.categories,
      },
      summary,
      expenses: rows.map((e) => ({
        id: e.id,
        date: e.date,
        category: e.category,
        amount: e.amount,
        description: e.description,
      })),
    };
    return new Blob([JSON.stringify(payload, null, 2)], { type: this.mimeType });
  },
};
