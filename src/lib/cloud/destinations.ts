import type { DestinationId, IntegrationId } from './types';

export interface DestinationMeta {
  id: DestinationId;
  name: string;
  short: string;
  description: string;
  /** Requires connecting an account first. */
  integration: boolean;
  /** Brand-ish colour for the glyph tile. */
  color: string;
  /** Default folder / spreadsheet name when connecting. */
  defaultTarget?: string;
  /** Simulated delivery stages shown in the background job tray. */
  stages: string[];
  /** Past-tense verb for activity, e.g. "Uploaded to". */
  verb: string;
  scopes?: string[];
}

export const DESTINATIONS: Record<DestinationId, DestinationMeta> = {
  download: {
    id: 'download',
    name: 'Download',
    short: 'Download',
    description: 'Save the file to this device.',
    integration: false,
    color: '#475569',
    stages: ['Generating file', 'Preparing download'],
    verb: 'Downloaded',
  },
  email: {
    id: 'email',
    name: 'Email',
    short: 'Email',
    description: 'Send as an attachment to anyone.',
    integration: false,
    color: '#e11d48',
    stages: ['Generating attachment', 'Uploading to mail relay', 'Sending', 'Delivered'],
    verb: 'Emailed',
  },
  link: {
    id: 'link',
    name: 'Share link',
    short: 'Link',
    description: 'A read-only web report anyone can open — with QR code.',
    integration: false,
    color: '#7c3aed',
    stages: ['Building snapshot'],
    verb: 'Shared',
  },
  'google-sheets': {
    id: 'google-sheets',
    name: 'Google Sheets',
    short: 'Sheets',
    description: 'Push rows into a spreadsheet. Optional live sync.',
    integration: true,
    color: '#16a34a',
    defaultTarget: 'Spendwise Expenses',
    stages: ['Generating rows', 'Authenticating', 'Writing to spreadsheet', 'Formatting sheet'],
    verb: 'Synced to',
    scopes: ['Create and edit spreadsheets it creates', 'View your email address'],
  },
  'google-drive': {
    id: 'google-drive',
    name: 'Google Drive',
    short: 'Drive',
    description: 'Upload into a Drive folder.',
    integration: true,
    color: '#ca8a04',
    defaultTarget: '/Spendwise',
    stages: ['Generating file', 'Authenticating', 'Uploading', 'Verifying checksum'],
    verb: 'Uploaded to',
    scopes: ['See and upload files it creates', 'View your email address'],
  },
  dropbox: {
    id: 'dropbox',
    name: 'Dropbox',
    short: 'Dropbox',
    description: 'Upload into an app folder.',
    integration: true,
    color: '#2563eb',
    defaultTarget: '/Apps/Spendwise',
    stages: ['Generating file', 'Authenticating', 'Uploading', 'Verifying checksum'],
    verb: 'Uploaded to',
    scopes: ['Read and write files in Apps/Spendwise', 'View basic account info'],
  },
  onedrive: {
    id: 'onedrive',
    name: 'OneDrive',
    short: 'OneDrive',
    description: 'Upload into your OneDrive.',
    integration: true,
    color: '#0284c7',
    defaultTarget: '/Documents/Spendwise',
    stages: ['Generating file', 'Authenticating', 'Uploading', 'Verifying checksum'],
    verb: 'Uploaded to',
    scopes: ['Read and write files it creates', 'Maintain access while you are offline'],
  },
};

export const INTEGRATION_IDS: IntegrationId[] = ['google-sheets', 'google-drive', 'dropbox', 'onedrive'];
export const DESTINATION_ORDER: DestinationId[] = ['download', 'email', 'link', ...INTEGRATION_IDS];

export function isIntegration(id: DestinationId): id is IntegrationId {
  return DESTINATIONS[id].integration;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (v: string) => EMAIL_RE.test(v.trim());

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.round((now - new Date(iso).getTime()) / 1000);
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
