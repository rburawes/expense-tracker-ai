import { CATEGORY_META } from '@/lib/categories';
import type { Category } from '@/lib/types';

interface Props {
  category: Category;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: { box: 'h-8 w-8 rounded-lg', icon: 16 },
  md: { box: 'h-10 w-10 rounded-xl', icon: 20 },
  lg: { box: 'h-12 w-12 rounded-xl', icon: 22 },
};

export function CategoryGlyph({ category, size = 20 }: { category: Category; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={CATEGORY_META[category].icon} />
    </svg>
  );
}

export function CategoryIcon({ category, size = 'md', className = '' }: Props) {
  const s = SIZES[size];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${s.box} ${CATEGORY_META[category].soft} ${className}`}
    >
      <CategoryGlyph category={category} size={s.icon} />
    </span>
  );
}

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${CATEGORY_META[category].badge}`}
    >
      <CategoryGlyph category={category} size={13} />
      {category}
    </span>
  );
}
