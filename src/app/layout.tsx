import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { MobileNav } from '@/components/layout/MobileNav';
import { Providers } from '@/components/providers/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Spendwise — Expense Tracker',
    template: '%s · Spendwise',
  },
  description: 'Track, filter and understand your personal spending.',
  applicationName: 'Spendwise',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4f46e5',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <Providers>
          <AppHeader />
          <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pt-8 md:pb-12 lg:px-8">{children}</main>
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
