export type TemplateId = 'tax-report' | 'monthly-summary' | 'category-analysis' | 'full-backup';

/** Cloud services that need an account connection. */
export type IntegrationId = 'google-sheets' | 'google-drive' | 'dropbox' | 'onedrive';

/** Everywhere an export can be delivered. */
export type DestinationId = 'download' | 'email' | 'link' | IntegrationId;

export type Frequency = 'daily' | 'weekly' | 'monthly';

export interface Connection {
  id: IntegrationId;
  account: string;
  connectedAt: string;
  /** Folder (storage) or spreadsheet name (Sheets). */
  target: string;
  lastSyncAt: string | null;
  /** Google Sheets only: push every change automatically. */
  liveSync: boolean;
}

export interface ExportRecord {
  id: string;
  templateId: TemplateId;
  destination: DestinationId;
  createdAt: string;
  status: 'completed' | 'failed';
  trigger: 'manual' | 'schedule' | 'live-sync';
  period: string;
  rows: number;
  bytes: number;
  filename: string;
  /** Human-readable "where it went", e.g. "Sent to 2 recipients". */
  detail: string;
  error?: string;
}

export interface Schedule {
  id: string;
  name: string;
  templateId: TemplateId;
  destination: Exclude<DestinationId, 'download' | 'link'>;
  frequency: Frequency;
  /** HH:MM, local time. */
  time: string;
  /** 0 (Sun) – 6 (Sat), weekly only. */
  weekday: number;
  /** 1 – 28, monthly only. */
  dayOfMonth: number;
  /** Email destination only. */
  recipients: string[];
  active: boolean;
  createdAt: string;
  lastRunAt: string | null;
  nextRunAt: string;
}

export interface ShareLink {
  id: string;
  templateId: TemplateId;
  title: string;
  period: string;
  url: string;
  createdAt: string;
  expiresAt: string | null;
  includeTransactions: boolean;
}

export interface Job {
  id: string;
  title: string;
  destination: DestinationId;
  stage: string;
  progress: number;
  status: 'running' | 'done' | 'failed';
  quiet?: boolean;
}

export interface ExportRequest {
  templateId: TemplateId;
  period: string;
  destination: DestinationId;
  trigger?: ExportRecord['trigger'];
  /** Destination-specific options. */
  recipients?: string[];
  subject?: string;
  target?: string;
}
