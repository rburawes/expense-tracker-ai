'use client';

import Link from 'next/link';
import { useExpenses } from '@/components/providers/ExpenseProvider';
import { AlertCircleIcon } from './Icons';

export function StorageErrorBanner() {
  const { loadError } = useExpenses();
  if (!loadError) return null;
  return (
    <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <AlertCircleIcon size={20} className="shrink-0 text-amber-500" />
      <div>
        <p className="font-semibold">There was a problem loading your saved data</p>
        <p className="mt-0.5 text-amber-800">
          {loadError} You can keep using the app, or reset your data in{' '}
          <Link href="/settings" className="font-semibold underline underline-offset-2">
            Settings
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
