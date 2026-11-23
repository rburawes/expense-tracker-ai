import { todayISO } from '@/lib/format';

const MAX_LENGTH = 100;

/** Characters that are invalid in filenames on at least one major OS. */
// eslint-disable-next-line no-control-regex
const INVALID = /[<>:"/\\|?*\u0000-\u001f]/g;

/** Turns user input into a safe base filename (no extension). Returns '' if nothing usable remains. */
export function sanitizeFilename(input: string): string {
  return input
    .replace(INVALID, '-')
    .replace(/\s+/g, ' ')
    .replace(/-{2,}/g, '-')
    .trim()
    .replace(/^\.+/, '') // no hidden / relative names
    .replace(/[. ]+$/, '') // Windows strips trailing dots & spaces
    .slice(0, MAX_LENGTH);
}

/** Strips a trailing known extension the user may have typed (e.g. "report.csv"). */
export function stripExtension(name: string, extensions: string[]): string {
  const lower = name.toLowerCase();
  for (const ext of extensions) {
    if (lower.endsWith(`.${ext}`)) return name.slice(0, -(ext.length + 1));
  }
  return name;
}

export function suggestFilename(startDate: string, endDate: string): string {
  if (!startDate && !endDate) return `expenses-all-${todayISO()}`;
  if (startDate && endDate) return `expenses-${startDate}-to-${endDate}`;
  if (startDate) return `expenses-from-${startDate}`;
  return `expenses-until-${endDate}`;
}

export function buildFilename(input: string, extension: string, extensions: string[]): string {
  const base = sanitizeFilename(stripExtension(input.trim(), extensions)) || `expenses-${todayISO()}`;
  return `${base}.${extension}`;
}
