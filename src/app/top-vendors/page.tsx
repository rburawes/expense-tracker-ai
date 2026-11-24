import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TopVendorsView } from '@/components/top-vendors/TopVendorsView';
import { ListSkeleton } from '@/components/ui/Skeleton';

export const metadata: Metadata = { title: 'Top Vendors' };

export default function TopVendorsPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <TopVendorsView />
    </Suspense>
  );
}
