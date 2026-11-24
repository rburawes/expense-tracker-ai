import { DashboardIcon, ListIcon, SettingsIcon, StoreIcon, TrophyIcon } from '@/components/ui/Icons';

export const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: DashboardIcon },
  { href: '/expenses', label: 'Expenses', icon: ListIcon },
  { href: '/top-categories', label: 'Top Categories', shortLabel: 'Categories', icon: TrophyIcon },
  { href: '/top-vendors', label: 'Top Vendors', shortLabel: 'Vendors', icon: StoreIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];

/** Bottom-bar links on mobile, either side of the add button (Settings lives in the mobile header). */
export const MOBILE_NAV_LEFT = ['/', '/expenses'] as const;
export const MOBILE_NAV_RIGHT = ['/top-categories', '/top-vendors'] as const;

export function navItem(href: string): NavItem {
  const item = NAV_ITEMS.find((i) => i.href === href);
  if (!item) throw new Error(`Unknown nav item: ${href}`);
  return item;
}

export function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}
