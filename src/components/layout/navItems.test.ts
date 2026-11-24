import { describe, expect, it } from 'vitest';
import { MOBILE_HEADER_LINKS, MOBILE_NAV_LEFT, MOBILE_NAV_RIGHT, NAV_ITEMS, isActive, navItem } from './navItems';

describe('navItems', () => {
  it('every mobile bottom-bar href resolves to a nav item', () => {
    for (const href of [...MOBILE_NAV_LEFT, ...MOBILE_NAV_RIGHT]) {
      expect(navItem(href).href).toBe(href);
    }
  });

  it('shows every page on mobile, in either the bottom bar or the header', () => {
    const mobile = new Set<string>([...MOBILE_NAV_LEFT, ...MOBILE_NAV_RIGHT]);
    expect(NAV_ITEMS.filter((i) => !mobile.has(i.href)).map((i) => i.href)).toEqual([...MOBILE_HEADER_LINKS]);
  });

  it('throws for an unknown href', () => {
    expect(() => navItem('/nope')).toThrow();
  });

  it('does not mark one ranking page active on the other', () => {
    expect(isActive('/top-categories', '/top-vendors')).toBe(false);
    expect(isActive('/top-vendors', '/top-vendors')).toBe(true);
  });
});
