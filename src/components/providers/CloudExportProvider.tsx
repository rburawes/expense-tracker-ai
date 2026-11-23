'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { JobsTray } from '@/components/cloud/JobsTray';
import { DESTINATIONS, formatBytes, isIntegration } from '@/lib/cloud/destinations';
import { computeNextRun } from '@/lib/cloud/schedule';
import { defaultPeriod, getTemplate } from '@/lib/cloud/templates';
import type {
  Connection,
  ExportRecord,
  ExportRequest,
  IntegrationId,
  Job,
  Schedule,
  ShareLink,
} from '@/lib/cloud/types';
import { createId } from '@/lib/id';
import { useExpenses } from './ExpenseProvider';
import { useToast } from './ToastProvider';

const STORAGE_KEY = 'spendwise.cloud.v1';
const MAX_HISTORY = 100;
const SCHEDULER_INTERVAL_MS = 30_000;
const LIVE_SYNC_DEBOUNCE_MS = 2_500;
const STAGE_MS = 650;

interface PersistedState {
  connections: Partial<Record<IntegrationId, Connection>>;
  schedules: Schedule[];
  history: ExportRecord[];
  shares: ShareLink[];
}

const EMPTY: PersistedState = { connections: {}, schedules: [], history: [], shares: [] };

function load(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<PersistedState>;
    return {
      connections: p.connections && typeof p.connections === 'object' ? p.connections : {},
      schedules: Array.isArray(p.schedules) ? p.schedules : [],
      history: Array.isArray(p.history) ? p.history : [],
      shares: Array.isArray(p.shares) ? p.shares : [],
    };
  } catch {
    return EMPTY;
  }
}

export type SyncStatus =
  | { kind: 'offline' }
  | { kind: 'syncing'; label: string }
  | { kind: 'attention'; label: string }
  | { kind: 'synced'; at: string | null };

export type NewSchedule = Omit<Schedule, 'id' | 'createdAt' | 'lastRunAt' | 'nextRunAt'>;

interface CloudExportContextValue extends PersistedState {
  hydrated: boolean;
  jobs: Job[];
  status: SyncStatus;
  connect: (id: IntegrationId, account: string) => void;
  disconnect: (id: IntegrationId) => void;
  updateConnection: (id: IntegrationId, patch: Partial<Pick<Connection, 'target' | 'liveSync'>>) => void;
  runExport: (req: ExportRequest) => Promise<ExportRecord>;
  syncNow: (id: IntegrationId) => void;
  addSchedule: (input: NewSchedule) => Schedule;
  updateSchedule: (id: string, patch: Partial<NewSchedule>) => void;
  removeSchedule: (id: string) => void;
  runScheduleNow: (id: string) => void;
  addShare: (link: ShareLink) => void;
  removeShare: (id: string) => void;
  clearHistory: () => void;
}

const CloudExportContext = createContext<CloudExportContextValue | null>(null);

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function downloadText(content: string, mimeType: string, filename: string) {
  const parts = mimeType.startsWith('text/csv') ? ['﻿', content] : [content];
  const url = URL.createObjectURL(new Blob(parts, { type: mimeType }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function CloudExportProvider({ children }: { children: ReactNode }) {
  const { expenses, currency, isLoaded } = useExpenses();
  const { toast } = useToast();
  const [state, setState] = useState<PersistedState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Latest values for timers / async jobs.
  const stateRef = useRef(state);
  stateRef.current = state;
  const expensesRef = useRef(expenses);
  expensesRef.current = expenses;
  const currencyRef = useRef(currency);
  currencyRef.current = currency;

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota / private mode — cloud prefs are non-critical */
    }
  }, [state, hydrated]);

  const patchJob = useCallback((id: string, patch: Partial<Job>) => {
    setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  /* ---------------------------- core export ---------------------------- */

  const runExport = useCallback(
    async (req: ExportRequest): Promise<ExportRecord> => {
      const template = getTemplate(req.templateId);
      const dest = DESTINATIONS[req.destination];
      const trigger = req.trigger ?? 'manual';
      const quiet = trigger === 'live-sync';
      const jobId = createId();
      const conn = isIntegration(req.destination) ? stateRef.current.connections[req.destination] : undefined;

      setJobs((js) => [
        ...js,
        { id: jobId, title: `${template.name} → ${dest.short}`, destination: req.destination, stage: 'Queued', progress: 0.04, status: 'running', quiet },
      ]);

      const base = {
        id: createId(),
        templateId: req.templateId,
        destination: req.destination,
        createdAt: new Date().toISOString(),
        trigger,
        period: req.period,
      };

      try {
        if (isIntegration(req.destination) && !conn) {
          throw new Error(`${dest.name} is not connected`);
        }
        const built = template.build(expensesRef.current, req.period, currencyRef.current);
        if (built.rows === 0 && req.templateId !== 'full-backup') {
          throw new Error('No expenses in the selected period');
        }

        for (let i = 0; i < dest.stages.length; i++) {
          patchJob(jobId, { stage: dest.stages[i], progress: (i + 1) / (dest.stages.length + 1) });
          await sleep(quiet ? STAGE_MS / 2 : STAGE_MS);
        }
        if (req.destination === 'download') downloadText(built.content, built.mimeType, built.filename);

        const target = req.target ?? conn?.target ?? '';
        const detail =
          req.destination === 'download'
            ? `Saved as ${built.filename}`
            : req.destination === 'email'
              ? `Sent to ${(req.recipients ?? []).join(', ')}`
              : req.destination === 'google-sheets'
                ? `“${target}” › ${template.name} tab`
                : `${target.replace(/\/$/, '')}/${built.filename}`;

        const record: ExportRecord = {
          ...base,
          status: 'completed',
          rows: built.rows,
          bytes: new Blob([built.content]).size,
          filename: built.filename,
          detail,
        };

        setState((s) => {
          let history = [record, ...s.history];
          // Coalesce consecutive live-sync entries so edits don't flood the activity feed.
          if (quiet && s.history[0]?.trigger === 'live-sync') history = [record, ...s.history.slice(1)];
          const connections = conn
            ? { ...s.connections, [conn.id]: { ...s.connections[conn.id]!, lastSyncAt: record.createdAt } }
            : s.connections;
          return { ...s, connections, history: history.slice(0, MAX_HISTORY) };
        });
        patchJob(jobId, { stage: 'Done', progress: 1, status: 'done' });
        if (!quiet) {
          toast({
            type: 'success',
            title: `${dest.verb}${dest.verb.endsWith('to') ? ` ${dest.name}` : ''}`,
            description: `${template.name} · ${record.rows} rows · ${formatBytes(record.bytes)}`,
          });
        }
        return record;
      } catch (err) {
        const message = (err as Error).message;
        const record: ExportRecord = {
          ...base,
          status: 'failed',
          rows: 0,
          bytes: 0,
          filename: '',
          detail: `Could not deliver to ${dest.name}`,
          error: message,
        };
        setState((s) => ({ ...s, history: [record, ...s.history].slice(0, MAX_HISTORY) }));
        patchJob(jobId, { stage: message, progress: 1, status: 'failed' });
        toast({ type: 'error', title: `${template.name} failed`, description: message });
        return record;
      } finally {
        window.setTimeout(() => setJobs((js) => js.filter((j) => j.id !== jobId)), 4000);
      }
    },
    [patchJob, toast],
  );

  /* ---------------------------- connections ---------------------------- */

  const connect = useCallback((id: IntegrationId, account: string) => {
    setState((s) => ({
      ...s,
      connections: {
        ...s.connections,
        [id]: {
          id,
          account,
          connectedAt: new Date().toISOString(),
          target: DESTINATIONS[id].defaultTarget ?? '',
          lastSyncAt: null,
          liveSync: false,
        },
      },
    }));
  }, []);

  const disconnect = useCallback((id: IntegrationId) => {
    setState((s) => {
      const connections = { ...s.connections };
      delete connections[id];
      // Pause schedules that relied on it rather than letting them fail silently.
      const schedules = s.schedules.map((sc) => (sc.destination === id ? { ...sc, active: false } : sc));
      return { ...s, connections, schedules };
    });
  }, []);

  const updateConnection = useCallback(
    (id: IntegrationId, patch: Partial<Pick<Connection, 'target' | 'liveSync'>>) => {
      setState((s) =>
        s.connections[id] ? { ...s, connections: { ...s.connections, [id]: { ...s.connections[id]!, ...patch } } } : s,
      );
    },
    [],
  );

  const syncNow = useCallback(
    (id: IntegrationId) => {
      const templateId = id === 'google-sheets' ? 'tax-report' : 'full-backup';
      void runExport({ templateId, period: defaultPeriod(getTemplate(templateId).periodKind), destination: id });
    },
    [runExport],
  );

  /* ------------------------------ schedules ----------------------------- */

  const addSchedule = useCallback((input: NewSchedule) => {
    const schedule: Schedule = {
      ...input,
      id: createId(),
      createdAt: new Date().toISOString(),
      lastRunAt: null,
      nextRunAt: computeNextRun(input).toISOString(),
    };
    setState((s) => ({ ...s, schedules: [...s.schedules, schedule] }));
    return schedule;
  }, []);

  const updateSchedule = useCallback((id: string, patch: Partial<NewSchedule>) => {
    setState((s) => ({
      ...s,
      schedules: s.schedules.map((sc) => {
        if (sc.id !== id) return sc;
        const next = { ...sc, ...patch };
        return { ...next, nextRunAt: computeNextRun(next).toISOString() };
      }),
    }));
  }, []);

  const removeSchedule = useCallback((id: string) => {
    setState((s) => ({ ...s, schedules: s.schedules.filter((sc) => sc.id !== id) }));
  }, []);

  // Guards against double execution (StrictMode double effects, overlapping ticks).
  const executedRuns = useRef(new Set<string>());

  const executeSchedule = useCallback(
    (sc: Schedule, force = false) => {
      const runKey = `${sc.id}@${sc.nextRunAt}`;
      if (!force) {
        if (executedRuns.current.has(runKey)) return;
        executedRuns.current.add(runKey);
      }
      const now = new Date();
      setState((s) => ({
        ...s,
        schedules: s.schedules.map((x) =>
          x.id === sc.id ? { ...x, lastRunAt: now.toISOString(), nextRunAt: computeNextRun(x, now).toISOString() } : x,
        ),
      }));
      void runExport({
        templateId: sc.templateId,
        period: defaultPeriod(getTemplate(sc.templateId).periodKind, now),
        destination: sc.destination,
        trigger: 'schedule',
        recipients: sc.recipients,
      });
    },
    [runExport],
  );

  const runScheduleNow = useCallback(
    (id: string) => {
      const sc = stateRef.current.schedules.find((x) => x.id === id);
      if (sc) executeSchedule(sc, true);
    },
    [executeSchedule],
  );

  // Background scheduler: runs anything due (including runs missed while the app was closed — once).
  useEffect(() => {
    if (!hydrated || !isLoaded) return;
    const tick = () => {
      const now = Date.now();
      for (const sc of stateRef.current.schedules) {
        if (sc.active && new Date(sc.nextRunAt).getTime() <= now) executeSchedule(sc);
      }
    };
    tick();
    const id = window.setInterval(tick, SCHEDULER_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [hydrated, isLoaded, executeSchedule]);

  /* ------------------------------ live sync ----------------------------- */

  const firstExpenses = useRef(true);
  const sheetsLive = !!state.connections['google-sheets']?.liveSync;
  useEffect(() => {
    if (!isLoaded || !hydrated) return;
    if (firstExpenses.current) {
      firstExpenses.current = false;
      return;
    }
    if (!sheetsLive) return;
    const t = window.setTimeout(() => {
      void runExport({
        templateId: 'tax-report',
        period: defaultPeriod('year'),
        destination: 'google-sheets',
        trigger: 'live-sync',
      });
    }, LIVE_SYNC_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
    // Only react to data changes, not to the toggle itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses]);

  /* -------------------------------- shares ------------------------------ */

  const addShare = useCallback((link: ShareLink) => {
    setState((s) => ({ ...s, shares: [link, ...s.shares] }));
  }, []);
  const removeShare = useCallback((id: string) => {
    setState((s) => ({ ...s, shares: s.shares.filter((x) => x.id !== id) }));
  }, []);
  const clearHistory = useCallback(() => setState((s) => ({ ...s, history: [] })), []);

  /* -------------------------------- status ------------------------------ */

  const status: SyncStatus = useMemo(() => {
    const running = jobs.filter((j) => j.status === 'running');
    if (running.length) {
      return { kind: 'syncing', label: running.length === 1 ? running[0].stage : `${running.length} tasks running` };
    }
    const conns = Object.values(state.connections);
    const lastAuto = state.history.find((h) => h.trigger !== 'manual');
    if (lastAuto?.status === 'failed') return { kind: 'attention', label: lastAuto.error ?? 'Last automatic export failed' };
    if (!conns.length && !state.schedules.length) return { kind: 'offline' };
    const at = conns.map((c) => c.lastSyncAt).filter(Boolean).sort().reverse()[0] ?? null;
    return { kind: 'synced', at };
  }, [jobs, state]);

  const value = useMemo<CloudExportContextValue>(
    () => ({
      ...state,
      hydrated,
      jobs,
      status,
      connect,
      disconnect,
      updateConnection,
      runExport,
      syncNow,
      addSchedule,
      updateSchedule,
      removeSchedule,
      runScheduleNow,
      addShare,
      removeShare,
      clearHistory,
    }),
    [state, hydrated, jobs, status, connect, disconnect, updateConnection, runExport, syncNow, addSchedule, updateSchedule, removeSchedule, runScheduleNow, addShare, removeShare, clearHistory],
  );

  return (
    <CloudExportContext.Provider value={value}>
      {children}
      <JobsTray jobs={jobs} />
    </CloudExportContext.Provider>
  );
}

export function useCloudExport(): CloudExportContextValue {
  const ctx = useContext(CloudExportContext);
  if (!ctx) throw new Error('useCloudExport must be used within CloudExportProvider');
  return ctx;
}
