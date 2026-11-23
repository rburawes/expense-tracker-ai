import { DESTINATIONS } from '@/lib/cloud/destinations';
import type { DestinationId } from '@/lib/cloud/types';

/**
 * Generic, brand-coloured glyphs for each destination. Deliberately simple
 * shapes rather than the services' trademarked logos.
 */
const PATHS: Record<DestinationId, string[]> = {
  download: ['M12 4v11m0 0 4-4m-4 4-4-4', 'M4 19h16'],
  email: ['M3.5 6.5h17v11h-17z', 'm4 7 8 6 8-6'],
  link: [
    'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1',
    'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  ],
  'google-sheets': ['M6 3h9l4 4v14H6z', 'M9 11h7v7H9z', 'M9 14.5h7M12.5 11v7'],
  'google-drive': ['M8.5 4h7l5.5 9.5-3.5 6H6.5L3 13.5 8.5 4Z', 'M8.5 4 12 10M3 13.5h11M17.5 19.5 14 13.5'],
  dropbox: ['m7 4-5 3.2L7 10.4l5-3.2L7 4Z', 'm17 4-5 3.2 5 3.2 5-3.2L17 4Z', 'M2 13.6 7 10.4l5 3.2-5 3.2-5-3.2Z', 'm17 10.4 5 3.2-5 3.2-5-3.2 5-3.2Z', 'm7 18 5 3 5-3'],
  onedrive: ['M7 18a4.5 4.5 0 0 1-.9-8.9A6 6 0 0 1 17.7 8 4.5 4.5 0 0 1 17 18H7Z'],
};

export function DestinationGlyph({
  id,
  size = 'md',
  className = '',
}: {
  id: DestinationId;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const box = size === 'sm' ? 'h-8 w-8 rounded-lg' : size === 'lg' ? 'h-12 w-12 rounded-2xl' : 'h-10 w-10 rounded-xl';
  const icon = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  const color = DESTINATIONS[id].color;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${box} ${className}`}
      style={{ backgroundColor: `${color}14`, color, boxShadow: `inset 0 0 0 1px ${color}26` }}
    >
      <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {PATHS[id].map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    </span>
  );
}

export function TemplateGlyph({ path, gradient, size = 'md' }: { path: string; gradient: string; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-12 w-12 rounded-2xl' : 'h-10 w-10 rounded-xl';
  return (
    <span className={`inline-flex shrink-0 items-center justify-center bg-gradient-to-br text-white shadow-sm ${gradient} ${box}`}>
      <svg width={size === 'lg' ? 24 : 20} height={size === 'lg' ? 24 : 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={path} />
      </svg>
    </span>
  );
}
