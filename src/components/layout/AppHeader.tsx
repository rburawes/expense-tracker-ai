'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useExpenseDialog } from '@/components/providers/ExpenseDialogProvider';
import { PlusIcon, SettingsIcon, WalletIcon } from '@/components/ui/Icons';
import { NAV_ITEMS, isActive } from './navItems';

export function AppHeader() {
  const pathname = usePathname();
  const { openCreate } = useExpenseDialog();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm shadow-indigo-600/30">
            <WalletIcon size={20} />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">Spendwise</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <button type="button" onClick={openCreate} className="btn btn-primary hidden md:inline-flex">
          <PlusIcon size={18} strokeWidth={2.25} />
          Add expense
          <kbd className="ml-1 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium">N</kbd>
        </button>

        <Link
          href="/settings"
          aria-label="Settings"
          aria-current={isActive(pathname, '/settings') ? 'page' : undefined}
          className={`btn-icon md:hidden ${isActive(pathname, '/settings') ? 'bg-indigo-50 text-indigo-600' : ''}`}
        >
          <SettingsIcon size={20} />
        </Link>
      </div>
    </header>
  );
}
