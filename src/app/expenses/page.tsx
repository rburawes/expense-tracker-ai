import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ExpensesView } from '@/components/expenses/ExpensesView';
import { ListSkeleton } from '@/components/ui/Skeleton';

export const metadata: Metadata = { title: 'Expenses' };

export default function ExpensesPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <ExpensesView />
    </Suspense>
  );
}
