import type { SVGProps } from 'react';
import type { ExportFormatId } from '@/lib/export';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function FileIcon({ label, size = 20, ...props }: IconProps & { label: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...props}>
      <path
        d="M6 3h8l4 4v14H6V3Z"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <path d="M14 3v4h4" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" />
      <text
        x="12"
        y="17.2"
        textAnchor="middle"
        fontSize="5.2"
        fontWeight={700}
        fill="currentColor"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {label}
      </text>
    </svg>
  );
}

export const FORMAT_ICONS: Record<ExportFormatId, (p: IconProps) => React.JSX.Element> = {
  csv: (p) => <FileIcon label="CSV" {...p} />,
  json: (p) => <FileIcon label="{ }" {...p} />,
  pdf: (p) => <FileIcon label="PDF" {...p} />,
};
