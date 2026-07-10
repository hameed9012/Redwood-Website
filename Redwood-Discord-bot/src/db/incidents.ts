import { db } from '../lib/supabase';
import type { PartyInput } from '../lib/shiftMath';

export interface Incident {
  id: string;
  shiftId: string;
  discordId: string;
  summary: string;
  location: string;
  createdAt: string;
}

export interface Party {
  id: string;
  incidentId: string;
  role: PartyInput['role'];
  name: string | null;
  coverName: string | null;
  plate: string | null;
  badge: string | null;
  unit: string | null;
}

interface IncidentRow {
  id: string; shift_id: string; discord_id: string;
  summary: string; location: string; created_at: string;
}
interface PartyRow {
  id: string; incident_id: string; role: PartyInput['role'];
  name: string | null; cover_name: string | null; plate: string | null;
  badge: string | null; unit: string | null;
}

const toIncident = (r: IncidentRow): Incident => ({
  id: r.id, shiftId: r.shift_id, discordId: r.discord_id,
  summary: r.summary, location: r.location, createdAt: r.created_at,
});
const toParty = (r: PartyRow): Party => ({
  id: r.id, incidentId: r.incident_id, role: r.role,
  name: r.name, coverName: r.cover_name, plate: r.plate, badge: r.badge, unit: r.unit,
});

export async function addIncident(shiftId: string, discordId: string, summary: string, location: string): Promise<Incident> {
  const { data, error } = await db().from('incidents')
    .insert({ shift_id: shiftId, discord_id: discordId, summary, location })
    .select('*').single();
  if (error) throw error;
  return toIncident(data as IncidentRow);
}

export async function addParty(incidentId: string, p: PartyInput): Promise<void> {
  const { error } = await db().from('incident_parties').insert({
    incident_id: incidentId,
    role: p.role,
    name: p.name ?? null,
    cover_name: p.coverName ?? null,
    plate: p.plate ?? null,
    badge: p.badge ?? null,
    unit: p.unit ?? null,
  });
  if (error) throw error;
}

/** The most recent incident for a shift, or null. Used by `/shift party`. */
export async function latestIncidentForShift(shiftId: string): Promise<Incident | null> {
  const { data, error } = await db().from('incidents').select('*')
    .eq('shift_id', shiftId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data ? toIncident(data as IncidentRow) : null;
}

export async function countIncidents(shiftId: string): Promise<number> {
  const { count, error } = await db().from('incidents')
    .select('*', { count: 'exact', head: true }).eq('shift_id', shiftId);
  if (error) throw error;
  return count ?? 0;
}

export async function listIncidentsForShifts(shiftIds: string[]): Promise<Incident[]> {
  if (shiftIds.length === 0) return [];
  const { data, error } = await db().from('incidents').select('*').in('shift_id', shiftIds);
  if (error) throw error;
  return (data as IncidentRow[]).map(toIncident);
}

export async function listAllParties(): Promise<Party[]> {
  const { data, error } = await db().from('incident_parties').select('*');
  if (error) throw error;
  return (data as PartyRow[]).map(toParty);
}
