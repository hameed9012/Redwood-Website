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
