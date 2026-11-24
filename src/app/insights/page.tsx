import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MonthlyInsights } from '@/components/insights/MonthlyInsights';
import { ListSkeleton } from '@/components/ui/Skeleton';

export const metadata: Metadata = { title: 'Monthly insights' };

export default function InsightsPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={3} />}>
      <MonthlyInsights />
    </Suspense>
  );
}
