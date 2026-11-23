# Spendwise — Expense Tracker

A modern personal expense tracker built with **Next.js 14 (App Router)**, **TypeScript** and **Tailwind CSS**. All data stays in your browser (localStorage), so there's no backend and no sign-up.

## Features

- **Add, edit and delete expenses** with date, amount, category and description
- **Form validation**: required fields, positive amounts with at most 2 decimals (commas OK, e.g. `1,250.50`), no future dates, and description length limits. Errors show inline as you go.
- **Date picker** (native, accessible) with *Today / Yesterday* shortcuts
- **Dashboard**: total spending, this month vs last month, top category, average per expense
- **Charts**: 6-month spending bar chart with average line, and a category donut you can switch between *this month* and *all time*. Click a category to jump to its filtered list.
- **Expense list**: search, category filter, date range, quick ranges (this month, last month, last 30 days, this year), sorting, "show more" pagination
- **CSV export** of the current filtered view, or of everything from Settings (Excel-friendly UTF-8, protected against formula injection)
- **Undo** on delete, toast notifications, loading skeletons, empty states and a banner if saved data is corrupted
- **Currency setting** (USD, EUR, GBP, PHP, JPY and more; the default comes from your browser's locale)
- **Responsive**: table layout on desktop; on mobile, a card list, bottom tab bar and bottom-sheet form
- **Keyboard**: press **N** anywhere to add an expense and **Esc** to close dialogs. Focus stays trapped inside dialogs.
- Multiple open tabs stay in sync

## Getting started

Requires **Node.js 18.17+** (Node 20 or 22 recommended).

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Production build

```bash
npm run build
npm start
```

### Other scripts

| Command             | What it does                |
| ------------------- | --------------------------- |
| `npm run lint`      | ESLint (Next.js core rules) |
| `npm run typecheck` | TypeScript type check       |

## How to test every feature

1. **Empty state**: on first load the dashboard invites you to add an expense or load sample data.
2. **Validation**: click **Add expense** and submit an empty form. Each field shows an error. Then try `12.345`, `-5` or a future date.
3. **Add**: enter `1,250.50`, pick *Food*, type a description and save. A toast confirms it and the dashboard updates.
4. **Sample data**: click **Load sample data** (dashboard) or **Settings → Add sample data** to add 60 realistic expenses spread over about 6 months.
5. **Dashboard**: hover the bars and donut segments, switch *Month / All time*, and click a category in the legend.
6. **Search & filter** (Expenses page): search for "coffee", choose a category, set a From/To range or click a quick range, change the sort order, then click **Clear filters**.
7. **Edit**: click the pencil icon (or tap a row on mobile), change something and click **Save changes**.
8. **Delete & undo**: click the trash icon, then **Undo** in the toast.
9. **Export**: click **Export CSV**. The file contains only the rows that match your current filters.
10. **Persistence**: refresh the page. Your data is still there.
11. **Currency**: change it in **Settings** and the amounts across the app switch symbols (values are not converted).
12. **Mobile**: open DevTools device mode (e.g. iPhone 14). Use the bottom bar's **+** button.
13. **Reset**: **Settings → Delete all data** (asks for confirmation first).

## Project structure

```
src/
  app/                    # App Router routes: / (dashboard), /expenses, /settings, error & 404
  components/
    dashboard/            # Summary cards, monthly chart, category donut, recent list
    expenses/             # Expense form, filter bar, list/table rows, expenses page
    settings/             # Settings page
    layout/               # Header and mobile bottom nav
    providers/            # Expense store (context + localStorage), toasts, add/edit dialog
    ui/                   # Modal, confirm dialog, icons, skeletons, empty states
  lib/                    # Types, validation, formatting, analytics, filters, CSV, storage
```

State is managed with React hooks and context (`ExpenseProvider`). Each change is written to localStorage **before** state updates, so the UI never shows data that failed to save (for example, when storage is full).

## Notes

- Data is stored per browser and per device. Export CSV regularly if you want a backup.
- Charts are plain SVG/CSS, with no chart library, which keeps the bundle small (about 110 KB first load).
