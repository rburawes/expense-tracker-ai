import { monthlyTotals, sumAmounts, totalsByCategory } from '@/lib/analytics';
import { CATEGORIES, type Category, type Expense } from '@/lib/types';
import { filterByPeriod, getTemplate, periodLabel } from './templates';
import type { TemplateId } from './types';

/**
 * Share links are self-contained snapshots: the report data is compressed into
 * the URL fragment (never sent to any server), so a link works without a
 * backend and the recipient needs no account. The expiry is embedded and
 * enforced by the viewer page.
 */
export interface SnapshotV1 {
  v: 1;
  /** Template id */
  t: TemplateId;
  title: string;
  period: string;
  currency: string;
  /** Created / expires (ms epoch). */
  c: number;
  x: number | null;
  total: number;
  count: number;
  cats: [Category, number, number][];
  months: [string, number][];
  tx?: [string, Category, number, string][];
}

export const MAX_SHARED_TRANSACTIONS = 250;

export function buildSnapshot(
  expenses: Expense[],
  templateId: TemplateId,
  period: string,
  currency: string,
  opts: { includeTransactions: boolean; expiresAt: Date | null; now?: Date },
): SnapshotV1 {
  const rows = filterByPeriod(expenses, period);
  const now = opts.now ?? new Date();
  // Trend: the 12 months of a tax year, or the last 6 months for all-time reports.
  const isYear = /^\d{4}$/.test(period);
  const monthCount = isYear ? 12 : 6;
  const monthRef = isYear ? new Date(Number(period), 11, 1) : now;
  return {
    v: 1,
    t: templateId,
    title: getTemplate(templateId).name,
    period: periodLabel(period),
    currency,
    c: now.getTime(),
    x: opts.expiresAt ? opts.expiresAt.getTime() : null,
    total: sumAmounts(rows),
    count: rows.length,
    cats: totalsByCategory(rows).map((c) => [c.category, c.total, c.count]),
    months: period.length === 7 ? [] : monthlyTotals(rows, monthCount, monthRef).map((m) => [m.key, m.total]),
    ...(opts.includeTransactions
      ? {
          tx: [...rows]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, MAX_SHARED_TRANSACTIONS)
            .map((e) => [e.date, e.category, e.amount, e.description] as [string, Category, number, string]),
        }
      : {}),
  };
}

/* ---------------- encoding: JSON → deflate → base64url ---------------- */

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const buf = await new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream)).arrayBuffer();
  return new Uint8Array(buf);
}

const canCompress = () => typeof CompressionStream !== 'undefined';

/** "z." prefix = deflate-raw compressed, "j." = plain JSON (fallback for old browsers). */
export async function encodeSnapshot(s: SnapshotV1): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(s));
  if (canCompress()) return `z.${toBase64Url(await pipe(json, new CompressionStream('deflate-raw')))}`;
  return `j.${toBase64Url(json)}`;
}

export async function decodeSnapshot(token: string): Promise<SnapshotV1> {
  const [kind, data] = [token.slice(0, 2), token.slice(2)];
  let bytes = fromBase64Url(data);
  if (kind === 'z.') {
    if (typeof DecompressionStream === 'undefined') throw new Error('This browser cannot open compressed share links.');
    bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
  } else if (kind !== 'j.') {
    throw new Error('This link is not a valid Spendwise share link.');
  }
  const parsed = JSON.parse(new TextDecoder().decode(bytes)) as SnapshotV1;
  if (parsed?.v !== 1 || !Array.isArray(parsed.cats)) throw new Error('This share link is damaged or from a newer version.');
  parsed.cats = parsed.cats.filter(([c]) => (CATEGORIES as readonly string[]).includes(c));
  return parsed;
}

export function buildShareUrl(origin: string, token: string): string {
  return `${origin}/shared#d=${token}`;
}

/** QR codes top out around 2.9 KB in byte mode at low error correction; leave headroom. */
export const QR_MAX_URL_LENGTH = 2000;
