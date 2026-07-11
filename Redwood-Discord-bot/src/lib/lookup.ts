import type { Rank } from './ranks';

export type Role = 'civilian' | 'officer' | 'witness' | 'other';

export type Query =
  | { kind: 'member'; discordId: string }
  | { kind: 'text'; text: string };

export interface MemberLite {
  discordId: string;
  employeeName: string;
  rank: Rank;
  status: 'active' | 'dismissed';
}
export interface IdentityLite {
  discordId: string;
  legalName: string;
  dob: string;
  ssn: string;
  idNumber: string;
  bloodType: string;
  nextOfKin: string;
  status: 'active' | 'retired';
  issuedAt: string;
}
export interface PartyRow {
  role: Role;
  name: string | null;
  coverName: string | null;
  plate: string | null;
  badge: string | null;
  unit: string | null;
  incidentId: string;
}
export interface IncidentRow {
  id: string;
  loggedBy: string; // employee name of the shift owner
  summary: string;
  location: string;
  createdAt: string;
}

/** Everything the I/O layer gathers for the pure resolver to assemble. */
export interface LookupData {
  members: MemberLite[];
  identities: IdentityLite[];
  parties: PartyRow[];
  incidents: IncidentRow[];
}

export interface IncidentLine {
  summary: string;
  location: string;
  date: string;
  loggedBy: string;
}
export interface CoverView {
  legalName: string;
  dob: string;
  ssn: string;
  idNumber: string;
  bloodType: string;
  nextOfKin: string;
}

export type LookupResult =
  | {
      kind: 'member-file';
      employeeName: string;
      rank: Rank;
      dismissed: boolean;
      cover: CoverView | null; // null = redacted (non-HC)
      pastIdentities: string[] | null; // null = redacted (non-HC)
      incidents: IncidentLine[];
    }
  | { kind: 'outsider-dossier'; label: string; role: Role; incidents: IncidentLine[]; alsoSeen: string[] }
  | { kind: 'disambiguation'; matches: { label: string; kind: 'member' | 'outsider' }[] }
  | { kind: 'not-found' };

export function classifyQuery(raw: string): Query {
  const trimmed = raw.trim();
  const mention = trimmed.match(/^<@!?(\d{17,20})>$/);
  if (mention) return { kind: 'member', discordId: mention[1] };
  if (/^\d{17,20}$/.test(trimmed)) return { kind: 'member', discordId: trimmed };
  return { kind: 'text', text: trimmed };
}

const ci = (s: string | null | undefined) => (s ?? '').toLowerCase();
const contains = (hay: string | null | undefined, needle: string) => ci(hay).includes(needle.toLowerCase());
const equalsCi = (a: string | null | undefined, needle: string) => ci(a) === needle.toLowerCase();

function incidentLine(i: IncidentRow): IncidentLine {
  return { summary: i.summary, location: i.location, date: i.createdAt.slice(0, 10), loggedBy: i.loggedBy };
}

function memberFile(member: MemberLite, data: LookupData, viewerIsHC: boolean): Extract<LookupResult, { kind: 'member-file' }> {
  const own = data.identities.filter((i) => i.discordId === member.discordId);
  const active = own.find((i) => i.status === 'active') ?? null;
  const coverNames = own.map((i) => i.legalName);
  const byId = new Map(data.incidents.map((i) => [i.id, i]));
  const incidentIds = new Set<string>();
  for (const i of data.incidents) if (i.loggedBy === member.employeeName) incidentIds.add(i.id);
  for (const p of data.parties) {
    const tags = [p.name, p.coverName];
    if (tags.some((t) => equalsCi(t, member.employeeName) || coverNames.some((c) => equalsCi(t, c)))) incidentIds.add(p.incidentId);
  }
  const incidents = [...incidentIds].map((id) => byId.get(id)).filter((i): i is IncidentRow => !!i).map(incidentLine);
  return {
    kind: 'member-file',
    employeeName: member.employeeName,
    rank: member.rank,
    dismissed: member.status === 'dismissed',
    cover: viewerIsHC && active ? {
      legalName: active.legalName, dob: active.dob, ssn: active.ssn,
      idNumber: active.idNumber, bloodType: active.bloodType, nextOfKin: active.nextOfKin,
    } : null,
    pastIdentities: viewerIsHC ? own.filter((i) => i.status === 'retired').map((i) => i.legalName) : null,
    incidents,
  };
}

/** Which field of a party matched the text, for outsider labelling. */
function partyMatches(p: PartyRow, text: string): string | null {
  if (equalsCi(p.plate, text)) return p.plate!;
  if (equalsCi(p.badge, text)) return p.badge!;
  if (contains(p.name, text)) return p.name!;
  if (contains(p.coverName, text)) return p.coverName!;
  return null;
}

function outsiderDossier(label: string, data: LookupData): Extract<LookupResult, { kind: 'outsider-dossier' }> {
  const rows = data.parties.filter((p) => [p.plate, p.badge, p.name, p.coverName].some((v) => equalsCi(v, label) || contains(v, label)));
  const byId = new Map(data.incidents.map((i) => [i.id, i]));
  const incidentIds = [...new Set(rows.map((r) => r.incidentId))];
  const incidents = incidentIds.map((id) => byId.get(id)).filter((i): i is IncidentRow => !!i).map(incidentLine);
  const roleCounts = new Map<Role, number>();
  for (const r of rows) roleCounts.set(r.role, (roleCounts.get(r.role) ?? 0) + 1);
  const role = [...roleCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'other';
  const alsoSeen = [...new Set(
    data.parties
      .filter((p) => incidentIds.includes(p.incidentId))
      .flatMap((p) => [p.plate, p.badge, p.name, p.coverName])
      .filter((v): v is string => !!v && !equalsCi(v, label)),
  )];
  return { kind: 'outsider-dossier', label, role, incidents, alsoSeen };
}

export function buildLookupResult(query: Query, data: LookupData, viewerIsHC: boolean): LookupResult {
  if (query.kind === 'member') {
    const m = data.members.find((x) => x.discordId === query.discordId);
    return m ? memberFile(m, data, viewerIsHC) : { kind: 'not-found' };
  }

  const text = query.text;

  // Internal members: matched by employee name; HC also bridges cover legal name → member.
  const internal = new Map<string, MemberLite>();
  for (const m of data.members) if (contains(m.employeeName, text)) internal.set(m.discordId, m);
  if (viewerIsHC) {
    for (const idn of data.identities) {
      if (contains(idn.legalName, text)) {
        const owner = data.members.find((m) => m.discordId === idn.discordId);
        if (owner) internal.set(owner.discordId, owner);
      }
    }
  }

  // Outsider identifiers: distinct matched party fields not belonging to an internal member's cover.
  const internalCovers = new Set<string>();
  if (viewerIsHC) for (const idn of data.identities) if (internal.has(idn.discordId)) internalCovers.add(ci(idn.legalName));
  for (const m of internal.values()) internalCovers.add(ci(m.employeeName));

  const outsiderLabels = new Set<string>();
  for (const p of data.parties) {
    const matched = partyMatches(p, text);
    if (matched && !internalCovers.has(ci(matched))) outsiderLabels.add(matched);
  }

  const subjects: { label: string; kind: 'member' | 'outsider' }[] = [
    ...[...internal.values()].map((m) => ({ label: m.employeeName, kind: 'member' as const })),
    ...[...outsiderLabels].map((label) => ({ label, kind: 'outsider' as const })),
  ];

  if (subjects.length === 0) return { kind: 'not-found' };
  if (subjects.length > 1) return { kind: 'disambiguation', matches: subjects.slice(0, 8) };

  const only = subjects[0];
  if (only.kind === 'member') return memberFile([...internal.values()][0], data, viewerIsHC);
  return outsiderDossier(only.label, data);
}
