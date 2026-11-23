import type { Frequency, Schedule } from './types';

type Timing = Pick<Schedule, 'frequency' | 'time' | 'weekday' | 'dayOfMonth'>;

function atTime(d: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const r = new Date(d);
  r.setHours(h || 0, m || 0, 0, 0);
  return r;
}

/** The first run strictly after `from`. */
export function computeNextRun(t: Timing, from = new Date()): Date {
  switch (t.frequency) {
    case 'daily': {
      const c = atTime(from, t.time);
      if (c <= from) c.setDate(c.getDate() + 1);
      return c;
    }
    case 'weekly': {
      const c = atTime(from, t.time);
      c.setDate(c.getDate() + ((t.weekday - c.getDay() + 7) % 7));
      if (c <= from) c.setDate(c.getDate() + 7);
      return c;
    }
    case 'monthly': {
      const day = Math.min(Math.max(t.dayOfMonth, 1), 28);
      let c = atTime(new Date(from.getFullYear(), from.getMonth(), day), t.time);
      if (c <= from) c = atTime(new Date(from.getFullYear(), from.getMonth() + 1, day), t.time);
      return c;
    }
  }
}

export function upcomingRuns(t: Timing, count: number, from = new Date()): Date[] {
  const out: Date[] = [];
  let cursor = from;
  for (let i = 0; i < count; i++) {
    cursor = computeNextRun(t, cursor);
    out.push(cursor);
  }
  return out;
}

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function describeTiming(t: Timing): string {
  const at = formatTime(t.time);
  if (t.frequency === 'daily') return `Every day at ${at}`;
  if (t.frequency === 'weekly') return `Every ${WEEKDAYS[t.weekday]} at ${at}`;
  return `On the ${ordinal(t.dayOfMonth)} of every month at ${at}`;
}
