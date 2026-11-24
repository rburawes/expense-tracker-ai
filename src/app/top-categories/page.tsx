import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TopCategoriesView } from '@/components/top-categories/TopCategoriesView';
import { ListSkeleton } from '@/components/ui/Skeleton';

export const metadata: Metadata = { title: 'Top categories' };

export default function TopCategoriesPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={4} />}>
      <TopCategoriesView />
    </Suspense>
  );
}
