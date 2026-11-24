'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useExpenseDialog } from '@/components/providers/ExpenseDialogProvider';
import { PlusIcon } from '@/components/ui/Icons';
import { MOBILE_NAV_LEFT, MOBILE_NAV_RIGHT, isActive, navItem, type NavItem } from './navItems';

export function MobileNav() {
  const pathname = usePathname();
  const { openCreate } = useExpenseDialog();
  const renderLink = (item: NavItem) => {
    const { href, label, icon: Icon } = item;
    const short = 'shortLabel' in item ? item.shortLabel : label;
    const active = isActive(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        aria-label={short !== label ? label : undefined}
        aria-current={active ? 'page' : undefined}
        className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition ${
          active ? 'text-indigo-600' : 'text-slate-500'
        }`}
      >
        <Icon size={22} strokeWidth={active ? 2.1 : 1.75} />
        {short}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
    >
      <div className="mx-auto flex max-w-md items-center px-2">
        {MOBILE_NAV_LEFT.map((href) => renderLink(navItem(href)))}
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={openCreate}
            aria-label="Add expense"
            className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-4 ring-white transition active:scale-95"
          >
            <PlusIcon size={26} strokeWidth={2.25} />
          </button>
        </div>
        {MOBILE_NAV_RIGHT.map((href) => renderLink(navItem(href)))}
      </div>
    </nav>
  );
}
