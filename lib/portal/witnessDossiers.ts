import { serverDb } from './serverClient';

export interface PartyLite {
  role: 'civilian' | 'officer' | 'witness' | 'other';
  name: string | null;
  coverName: string | null;
  plate: string | null;
  badge: string | null;
  unit: string | null;
  summary: string;
  location: string;
}
export interface Dossier {
  key: string;
  label: string;
  role: PartyLite['role'];
  appearances: { summary: string; location: string }[];
}
export interface ReportLite {
  subject: string;
  body: string;
  date: string;
}

/** Pick the strongest identifier for a party as its dossier key. */
function identify(p: PartyLite): { key: string; label: string } | null {
  if (p.badge) return { key: `badge:${p.badge}`, label: `Badge ${p.badge}${p.unit ? ` · ${p.unit}` : ''}` };
  if (p.plate) return { key: `plate:${p.plate}`, label: `Plate ${p.plate}` };
  if (p.name) return { key: `name:${p.name.toLowerCase()}`, label: p.name };
  if (p.coverName) return { key: `cover:${p.coverName.toLowerCase()}`, label: p.coverName };
  return null;
}

/** Aggregate incident parties into per-identity dossiers. Pure. */
export function aggregateParties(parties: PartyLite[]): Dossier[] {
  const map = new Map<string, Dossier>();
  for (const p of parties) {
    const id = identify(p);
    if (!id) continue;
    const existing = map.get(id.key);
    if (existing) {
      existing.appearances.push({ summary: p.summary, location: p.location });
    } else {
      map.set(id.key, { key: id.key, label: id.label, role: p.role, appearances: [{ summary: p.summary, location: p.location }] });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.appearances.length - a.appearances.length);
}

export async function loadWitnessDossiers(): Promise<{ dossiers: Dossier[]; reports: ReportLite[] }> {
  const db = serverDb();
  if (!db) return { dossiers: [], reports: [] };

  const { data: partyData, error: pErr } = await db.from('incident_parties')
    .select('role, name, cover_name, plate, badge, unit, incident_id');
  if (pErr) throw pErr;
  const parties = partyData ?? [];

  const incidentIds = Array.from(new Set(parties.map((p: { incident_id: string }) => p.incident_id)));
  const incMap = new Map<string, { summary: string; location: string }>();
  if (incidentIds.length > 0) {
    const { data: incData, error: iErr } = await db.from('incidents')
      .select('id, summary, location').in('id', incidentIds);
    if (iErr) throw iErr;
    for (const i of incData ?? []) incMap.set(i.id, { summary: i.summary, location: i.location });
  }

  const partiesLite: PartyLite[] = parties.map((p: {
    role: PartyLite['role']; name: string | null; cover_name: string | null;
    plate: string | null; badge: string | null; unit: string | null; incident_id: string;
  }) => {
    const inc = incMap.get(p.incident_id) ?? { summary: '(unknown)', location: '(unknown)' };
    return {
      role: p.role, name: p.name, coverName: p.cover_name, plate: p.plate, badge: p.badge, unit: p.unit,
      summary: inc.summary, location: inc.location,
    };
  });

  const { data: reportData, error: rErr } = await db.from('reports')
    .select('subject, body, created_at').order('created_at', { ascending: false }).limit(50);
  if (rErr) throw rErr;
  const reports: ReportLite[] = (reportData ?? []).map((r: { subject: string; body: string; created_at: string }) => ({
    subject: r.subject, body: r.body, date: r.created_at.slice(0, 10),
  }));

  return { dossiers: aggregateParties(partiesLite), reports };
}
