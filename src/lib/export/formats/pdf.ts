import { formatDate } from '@/lib/format';
import type { ExportFormat } from '../types';

const INDIGO: [number, number, number] = [79, 70, 229];
const SLATE_900: [number, number, number] = [15, 23, 42];
const SLATE_500: [number, number, number] = [100, 116, 139];
const SLATE_200: [number, number, number] = [226, 232, 240];
const SLATE_50: [number, number, number] = [248, 250, 252];

/**
 * jsPDF's built-in fonts only cover Latin-1, so symbols like ₱ or ₹ would
 * render as garbage. Use ISO codes ("USD 12.50") in the PDF instead.
 */
function makeAmountFormatter(currency: string) {
  let nf: Intl.NumberFormat;
  try {
    nf = new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'code' });
  } catch {
    nf = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', currencyDisplay: 'code' });
  }
  return (n: number) => nf.format(n).replace(/ /g, ' ');
}

/** Right-align header/footer cells of numeric columns to match their body cells. */
function alignHeaders(rightColumns: number[]) {
  return (data: { section: string; column: { index: number }; cell: { styles: { halign?: unknown } } }) => {
    if (data.section !== 'body' && rightColumns.includes(data.column.index)) data.cell.styles.halign = 'right';
  };
}

export const pdfFormat: ExportFormat = {
  id: 'pdf',
  label: 'PDF',
  extension: 'pdf',
  mimeType: 'application/pdf',
  description: 'Formatted report with summary and category breakdown. Ready to print or share.',
  async build({ rows, summary, options, currency, generatedAt }) {
    // Lazy-load: ~350 KB that only PDF exporters need.
    const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
    const money = makeAmountFormatter(currency);

    const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = margin;

    // Header band
    doc.setFillColor(...INDIGO);
    doc.rect(0, 0, pageWidth, 6, 'F');
    y += 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...SLATE_900);
    doc.text('Expense Report', margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...SLATE_500);
    doc.text(
      `Generated ${generatedAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`,
      pageWidth - margin,
      y,
      { align: 'right' },
    );

    y += 18;
    const period =
      options.startDate || options.endDate
        ? `${options.startDate ? formatDate(options.startDate) : 'Beginning'} to ${
            options.endDate ? formatDate(options.endDate) : 'Today'
          }`
        : 'All time';
    doc.setFontSize(10);
    doc.text(`Period: ${period}`, margin, y);
    y += 14;
    doc.text(`Categories: ${options.categories.join(', ')}`, margin, y, {
      maxWidth: pageWidth - margin * 2,
    });
    y += 22;

    // KPI tiles
    const tiles = [
      { label: 'RECORDS', value: summary.count.toLocaleString('en-US') },
      { label: 'TOTAL', value: money(summary.total) },
      { label: 'AVERAGE', value: money(summary.count ? summary.total / summary.count : 0) },
    ];
    const gap = 12;
    const tileW = (pageWidth - margin * 2 - gap * (tiles.length - 1)) / tiles.length;
    const tileH = 52;
    tiles.forEach((t, i) => {
      const x = margin + i * (tileW + gap);
      doc.setFillColor(...SLATE_50);
      doc.setDrawColor(...SLATE_200);
      doc.roundedRect(x, y, tileW, tileH, 6, 6, 'FD');
      doc.setFontSize(8);
      doc.setTextColor(...SLATE_500);
      doc.text(t.label, x + 12, y + 18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...SLATE_900);
      doc.text(t.value, x + 12, y + 38);
      doc.setFont('helvetica', 'normal');
    });
    y += tileH + 24;

    // Category breakdown
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...SLATE_900);
    doc.text('By category', margin, y);
    y += 8;

    const headStyles = { fillColor: INDIGO, textColor: 255, fontStyle: 'bold' as const, fontSize: 9 };
    const bodyStyles = { fontSize: 9, textColor: SLATE_900, lineColor: SLATE_200 };

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Category', 'Records', 'Total', 'Share']],
      body: summary.byCategory.map((c) => [
        c.category,
        String(c.count),
        money(c.total),
        summary.total ? `${((c.total / summary.total) * 100).toFixed(1)}%` : '0%',
      ]),
      theme: 'grid',
      headStyles,
      bodyStyles,
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      didParseCell: alignHeaders([1, 2, 3]),
    });

    // Transactions
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 28;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...SLATE_900);
    doc.text('Transactions', margin, y);

    autoTable(doc, {
      startY: y + 8,
      margin: { left: margin, right: margin, bottom: 50 },
      head: [['Date', 'Category', 'Description', 'Amount']],
      body: rows.map((e) => [formatDate(e.date), e.category, e.description, money(e.amount)]),
      foot: [['', '', 'Total', money(summary.total)]],
      theme: 'striped',
      headStyles,
      bodyStyles,
      footStyles: { fillColor: SLATE_50, textColor: SLATE_900, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: SLATE_50 },
      showFoot: 'lastPage',
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 90 },
        3: { halign: 'right', cellWidth: 90 },
      },
      didParseCell: alignHeaders([3]),
    });

    // Page footers
    const pages = doc.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.getHeight();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...SLATE_500);
      doc.text('Expense Tracker', margin, pageHeight - 24);
      doc.text(`Page ${i} of ${pages}`, pageWidth - margin, pageHeight - 24, { align: 'right' });
    }

    return doc.output('blob');
  },
};
