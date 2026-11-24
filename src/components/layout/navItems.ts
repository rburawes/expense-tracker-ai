import { DashboardIcon, ListIcon, SettingsIcon, TrophyIcon } from '@/components/ui/Icons';

export const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: DashboardIcon },
  { href: '/expenses', label: 'Expenses', icon: ListIcon },
  { href: '/top-categories', label: 'Top Categories', icon: TrophyIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
] as const;

export function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}
