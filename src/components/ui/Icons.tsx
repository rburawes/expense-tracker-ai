import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function createIcon(paths: string | string[], displayName: string) {
  const list = Array.isArray(paths) ? paths : [paths];
  function Icon({ size = 20, strokeWidth = 1.75, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...props}
      >
        {list.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}

export const PlusIcon = createIcon('M12 5v14M5 12h14', 'PlusIcon');
export const DashboardIcon = createIcon(
  ['M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z'],
  'DashboardIcon',
);
export const ListIcon = createIcon('M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01', 'ListIcon');
export const SettingsIcon = createIcon(
  [
    'M10.3 4.3c.4-1.7 2.9-1.7 3.4 0a1.7 1.7 0 0 0 2.6 1.1c1.5-.9 3.3.8 2.4 2.4a1.7 1.7 0 0 0 1 2.5c1.8.5 1.8 3 0 3.5a1.7 1.7 0 0 0-1 2.5c.9 1.6-.9 3.3-2.4 2.4a1.7 1.7 0 0 0-2.6 1.1c-.5 1.7-3 1.7-3.4 0a1.7 1.7 0 0 0-2.6-1.1c-1.5.9-3.3-.8-2.4-2.4a1.7 1.7 0 0 0-1-2.5c-1.8-.5-1.8-3 0-3.5a1.7 1.7 0 0 0 1-2.5c-.9-1.6.9-3.3 2.4-2.4a1.7 1.7 0 0 0 2.6-1.1Z',
    'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  ],
  'SettingsIcon',
);
export const SearchIcon = createIcon('m21 21-4.3-4.3M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z', 'SearchIcon');
export const XIcon = createIcon('M18 6 6 18M6 6l12 12', 'XIcon');
export const PencilIcon = createIcon(
  'M16.9 4.6a2.1 2.1 0 0 1 3 3L8.5 19 4 20l1-4.5L16.9 4.6Z',
  'PencilIcon',
);
export const TrashIcon = createIcon(
  'M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3',
  'TrashIcon',
);
export const DownloadIcon = createIcon('M12 4v11m0 0 4-4m-4 4-4-4M4 19h16', 'DownloadIcon');
export const CalendarIcon = createIcon(
  'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  'CalendarIcon',
);
export const ArrowUpIcon = createIcon('M7 17 17 7M9 7h8v8', 'ArrowUpIcon');
export const ArrowDownIcon = createIcon('M7 7l10 10M17 9v8H9', 'ArrowDownIcon');
export const ArrowRightIcon = createIcon('M5 12h14m-5-5 5 5-5 5', 'ArrowRightIcon');
export const CheckCircleIcon = createIcon(
  ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'm8.5 12.5 2.5 2.5 5-5.5'],
  'CheckCircleIcon',
);
export const AlertCircleIcon = createIcon(
  ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'M12 8v4.5M12 16h.01'],
  'AlertCircleIcon',
);
export const InfoIcon = createIcon(
  ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'M12 11v5M12 8h.01'],
  'InfoIcon',
);
export const WalletIcon = createIcon(
  'M19 7V5.5A1.5 1.5 0 0 0 17.5 4h-12A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15M20 9h-4.5a3 3 0 0 0 0 6H20V9Zm-4 3h.01',
  'WalletIcon',
);
export const FilterIcon = createIcon('M4 5h16l-6 7.5V19l-4 1.5v-8L4 5Z', 'FilterIcon');
export const TrendIcon = createIcon('M3 17l6-6 4 4 8-8M15 7h6v6', 'TrendIcon');
export const ReceiptIcon = createIcon(
  'M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6m-6 4h3',
  'ReceiptIcon',
);
export const SparkleIcon = createIcon(
  'M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M6.3 17.7l2.5-2.5M15.2 8.8l2.5-2.5',
  'SparkleIcon',
);
export const DatabaseIcon = createIcon(
  [
    'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Z',
    'M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  ],
  'DatabaseIcon',
);
