import { DashboardIcon, ListIcon, SettingsIcon, StoreIcon } from '@/components/ui/Icons';

export const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: DashboardIcon },
  { href: '/expenses', label: 'Expenses', icon: ListIcon },
  { href: '/top-vendors', label: 'Top Vendors', icon: StoreIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
] as const;

export function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}
