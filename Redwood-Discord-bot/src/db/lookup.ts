import { db } from '../lib/supabase';
import type { Query, LookupData, MemberLite, IdentityLite, PartyRow, IncidentRow, Role } from '../lib/lookup';
import type { Rank } from '../lib/ranks';

interface MemberRow { discord_id: string; employee_name: string; rank: Rank; status: 'active' | 'dismissed'; }
interface IdentRow { discord_id: string; legal_name: string; dob: string; ssn: string; id_number: string; blood_type: string; next_of_kin: string; status: 'active' | 'retired'; issued_at: string; }
interface IncRow { id: string; discord_id: string; summary: string; location: string; created_at: string; }
interface PtyRow { incident_id: string; role: Role; name: string | null; cover_name: string | null; plate: string | null; badge: string | null; unit: string | null; }

const toMember = (r: MemberRow): MemberLite => ({ discordId: r.discord_id, employeeName: r.employee_name, rank: r.rank, status: r.status });
const toIdentity = (r: IdentRow): IdentityLite => ({ discordId: r.discord_id, legalName: r.legal_name, dob: r.dob, ssn: r.ssn, idNumber: r.id_number, bloodType: r.blood_type, nextOfKin: r.next_of_kin, status: r.status, issuedAt: r.issued_at });
const toParty = (r: PtyRow): PartyRow => ({ role: r.role, name: r.name, coverName: r.cover_name, plate: r.plate, badge: r.badge, unit: r.unit, incidentId: r.incident_id });

/** Resolve a set of incident rows to IncidentRow with loggedBy = the logging member's employee name. */
async function resolveIncidents(rows: IncRow[]): Promise<IncidentRow[]> {
  const ids = [...new Set(rows.map((r) => r.discord_id))];
  const nameOf = new Map<string, string>();
  if (ids.length) {
    const { data, error } = await db().from('members').select('discord_id, employee_name').in('discord_id', ids);
    if (error) throw error;
    for (const m of (data ?? []) as { discord_id: string; employee_name: string }[]) nameOf.set(m.discord_id, m.employee_name);
  }
  return rows.map((r) => ({ id: r.id, loggedBy: nameOf.get(r.discord_id) ?? 'Unknown', summary: r.summary, location: r.location, createdAt: r.created_at }));
}

async function incidentsByIds(ids: string[]): Promise<IncRow[]> {
  if (!ids.length) return [];
  const { data, error } = await db().from('incidents').select('id, discord_id, summary, location, created_at').in('id', ids);
  if (error) throw error;
  return (data ?? []) as IncRow[];
}

export async function gatherLookup(query: Query): Promise<LookupData> {
  if (query.kind === 'member') {
    const [{ data: mData, error: mErr }, { data: iData, error: iErr }, { data: logged, error: lErr }] = await Promise.all([
      db().from('members').select('discord_id, employee_name, rank, status').eq('discord_id', query.discordId).maybeSingle(),
      db().from('identities').select('discord_id, legal_name, dob, ssn, id_number, blood_type, next_of_kin, status, issued_at').eq('discord_id', query.discordId),
      db().from('incidents').select('id, discord_id, summary, location, created_at').eq('discord_id', query.discordId),
    ]);
    if (mErr) throw mErr; if (iErr) throw iErr; if (lErr) throw lErr;
    const members = mData ? [toMember(mData as MemberRow)] : [];
    const identities = ((iData ?? []) as IdentRow[]).map(toIdentity);
    const coverNames = [members[0]?.employeeName, ...identities.map((i) => i.legalName)].filter((v): v is string => !!v);
    let parties: PartyRow[] = [];
    let incRows = (logged ?? []) as IncRow[];
    if (coverNames.length) {
      const ors = coverNames.map((n) => `name.ilike.${n},cover_name.ilike.${n}`).join(',');
      const { data: pData, error: pErr } = await db().from('incident_parties')
        .select('incident_id, role, name, cover_name, plate, badge, unit').or(ors);
      if (pErr) throw pErr;
      parties = ((pData ?? []) as PtyRow[]).map(toParty);
      incRows = [...incRows, ...(await incidentsByIds([...new Set(parties.map((p) => p.incidentId))]))];
    }
    const incById = new Map(incRows.map((r) => [r.id, r]));
    return { members, identities, parties, incidents: await resolveIncidents([...incById.values()]) };
  }

  // text query
  const t = query.text;
  const like = `%${t}%`;
  const [{ data: mData, error: mErr }, { data: iData, error: iErr }, { data: pData, error: pErr }] = await Promise.all([
    db().from('members').select('discord_id, employee_name, rank, status').ilike('employee_name', like),
    db().from('identities').select('discord_id, legal_name, dob, ssn, id_number, blood_type, next_of_kin, status, issued_at').ilike('legal_name', like),
    db().from('incident_parties').select('incident_id, role, name, cover_name, plate, badge, unit')
      .or(`name.ilike.${like},cover_name.ilike.${like},plate.ilike.${t},badge.ilike.${t}`),
  ]);
  if (mErr) throw mErr; if (iErr) throw iErr; if (pErr) throw pErr;

  const members = ((mData ?? []) as MemberRow[]).map(toMember);
  const matchedIdentities = ((iData ?? []) as IdentRow[]).map(toIdentity);

  // Also load the full identity set for any matched member (so a member file shows their cover).
  const memberIds = members.map((m) => m.discordId);
  let memberIdentities: IdentityLite[] = [];
  if (memberIds.length) {
    const { data, error } = await db().from('identities')
      .select('discord_id, legal_name, dob, ssn, id_number, blood_type, next_of_kin, status, issued_at').in('discord_id', memberIds);
    if (error) throw error;
    memberIdentities = ((data ?? []) as IdentRow[]).map(toIdentity);
  }
  const identities = [...matchedIdentities, ...memberIdentities.filter((mi) => !matchedIdentities.some((x) => x.discordId === mi.discordId && x.legalName === mi.legalName))];

  const parties = ((pData ?? []) as PtyRow[]).map(toParty);

  const incidentIds = [...new Set(parties.map((p) => p.incidentId))];
  const partyIncidents = await incidentsByIds(incidentIds);
  const { data: loggedData, error: lErr } = memberIds.length
    ? await db().from('incidents').select('id, discord_id, summary, location, created_at').in('discord_id', memberIds)
    : { data: [], error: null };
  if (lErr) throw lErr;
  const incById = new Map<string, IncRow>();
  for (const r of [...partyIncidents, ...((loggedData ?? []) as IncRow[])]) incById.set(r.id, r);

  return { members, identities, parties, incidents: await resolveIncidents([...incById.values()]) };
}
