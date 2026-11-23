import type { Category } from './types';

export interface CategoryMeta {
  /** Hex colour used in charts. */
  color: string;
  /** Classes for small pill badges. */
  badge: string;
  /** Classes for the round icon container. */
  soft: string;
  /** Classes for the selected state in the category picker. */
  selected: string;
  /** SVG path data (24×24, stroked). */
  icon: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  Food: {
    color: '#f97316',
    badge: 'bg-orange-50 text-orange-700 ring-orange-600/20',
    soft: 'bg-orange-100 text-orange-600',
    selected: 'border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-500/20',
    icon: 'M7 3v7m-2.5-7v4.5a2.5 2.5 0 0 0 5 0V3M7 10v11M17 21V3c-2 0-3.5 2.2-3.5 6s1.5 5 3.5 5',
  },
  Transportation: {
    color: '#3b82f6',
    badge: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    soft: 'bg-blue-100 text-blue-600',
    selected: 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20',
    icon: 'M3 13l1.6-4.8A2 2 0 0 1 6.5 7h11a2 2 0 0 1 1.9 1.2L21 13v4a1 1 0 0 1-1 1h-1M3 13v4a1 1 0 0 0 1 1h1m-2-5h18M9 18h6M7 19.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  },
  Entertainment: {
    color: '#a855f7',
    badge: 'bg-purple-50 text-purple-700 ring-purple-600/20',
    soft: 'bg-purple-100 text-purple-600',
    selected: 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-500/20',
    icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-1.75-12.5v7l5.5-3.5-5.5-3.5Z',
  },
  Shopping: {
    color: '#ec4899',
    badge: 'bg-pink-50 text-pink-700 ring-pink-600/20',
    soft: 'bg-pink-100 text-pink-600',
    selected: 'border-pink-500 bg-pink-50 text-pink-700 ring-2 ring-pink-500/20',
    icon: 'M5.5 7.5h13l-1 12.5h-11l-1-12.5ZM9 7.5V6.5a3 3 0 0 1 6 0v1',
  },
  Bills: {
    color: '#14b8a6',
    badge: 'bg-teal-50 text-teal-700 ring-teal-600/20',
    soft: 'bg-teal-100 text-teal-600',
    selected: 'border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-500/20',
    icon: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6m-6 4h3',
  },
  Other: {
    color: '#64748b',
    badge: 'bg-slate-100 text-slate-700 ring-slate-600/20',
    soft: 'bg-slate-200 text-slate-600',
    selected: 'border-slate-500 bg-slate-100 text-slate-800 ring-2 ring-slate-500/20',
    icon: 'M4.5 4.5h6v6h-6v-6Zm9 0h6v6h-6v-6Zm-9 9h6v6h-6v-6Zm9 0h6v6h-6v-6Z',
  },
};
