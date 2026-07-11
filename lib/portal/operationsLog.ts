import { serverDb } from './serverClient';
import { shiftDurationMinutes, formatDuration } from './duration';

export interface ShiftLite {
  id: string;
  employeeName: string;
  startedAt: string;
  endedAt: string | null;
  movementAccount: string | null;
}
export interface IncidentLite {
  shiftId: string;
  summary: string;
  location: string;
}
export interface OpsRow {
  id: string;
  employeeName: string;
  date: string;
  duration: string;
  movementAccount: string | null;
  incidents: { summary: string; location: string }[];
}

/** Attach incidents to shifts and compute display fields. Pure. */
export function shapeOperationsLog(shifts: ShiftLite[], incidents: IncidentLite[]): OpsRow[] {
  return shifts.map((s) => ({
    id: s.id,
    employeeName: s.employeeName,
    date: s.startedAt.slice(0, 10),
    duration: s.endedAt ? formatDuration(shiftDurationMinutes(s.startedAt, s.endedAt)) : '—',
    movementAccount: s.movementAccount,
    incidents: incidents.filter((i) => i.shiftId === s.id).map((i) => ({ summary: i.summary, location: i.location })),
  }));
}

export async function loadOperationsLog(): Promise<OpsRow[]> {
  const db = serverDb();
  if (!db) return [];
  const { data: shiftData, error: sErr } = await db.from('shifts')
    .select('id, discord_id, started_at, ended_at, movement_account')
    .eq('status', 'closed').order('ended_at', { ascending: false }).limit(50);
  if (sErr) throw sErr;
  const shifts = shiftData ?? [];
  if (shifts.length === 0) return [];

  const ids = shifts.map((s: { id: string }) => s.id);
  const discordIds = Array.from(new Set(shifts.map((s: { discord_id: string }) => s.discord_id)));

  const { data: memberData, error: mErr } = await db.from('members')
    .select('discord_id, employee_name').in('discord_id', discordIds);
  if (mErr) throw mErr;
  const nameOf = new Map((memberData ?? []).map((m: { discord_id: string; employee_name: string }) => [m.discord_id, m.employee_name]));

  const { data: incData, error: iErr } = await db.from('incidents')
    .select('shift_id, summary, location').in('shift_id', ids);
  if (iErr) throw iErr;

  const shiftsLite: ShiftLite[] = shifts.map((s: {
    id: string; discord_id: string; started_at: string; ended_at: string | null; movement_account: string | null;
  }) => ({
    id: s.id,
    employeeName: nameOf.get(s.discord_id) ?? 'Unknown',
    startedAt: s.started_at,
    endedAt: s.ended_at,
    movementAccount: s.movement_account,
  }));
  const incidentsLite: IncidentLite[] = (incData ?? []).map((i: { shift_id: string; summary: string; location: string }) => ({
    shiftId: i.shift_id, summary: i.summary, location: i.location,
  }));
  return shapeOperationsLog(shiftsLite, incidentsLite);
}
