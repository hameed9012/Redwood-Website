export interface PartyInput {
  role: 'civilian' | 'officer' | 'witness' | 'other';
  name?: string | null;
  coverName?: string | null;
  plate?: string | null;
  badge?: string | null;
  unit?: string | null;
}

export function shiftDurationMinutes(startedAt: string, endedAt: string): number {
  const ms = Date.parse(endedAt) - Date.parse(startedAt);
  return ms > 0 ? Math.floor(ms / 60000) : 0;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/** Returns an error string if the party has no identifying field, else null. */
export function validateParty(p: PartyInput): string | null {
  const hasAny = [p.name, p.coverName, p.plate, p.badge, p.unit].some((v) => v && v.trim() !== '');
  return hasAny ? null : 'A party needs at least one of: name, cover name, plate, badge, or unit.';
}
