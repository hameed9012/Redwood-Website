export const RANKS = ['trainee', 'employee', 'supervisor', 'high-command'] as const;
export type Rank = (typeof RANKS)[number];

export const DIVISIONS = ['security', 'research', 'intelligence'] as const;
export type Division = (typeof DIVISIONS)[number];

export const POSITIONS = [
  'trainee-instructor',
  'internal-affairs',
  'representative',
  'media-relations',
] as const;
export type Position = (typeof POSITIONS)[number];

export const RANK_LABEL: Record<Rank, string> = {
  trainee: 'Trainee',
  employee: 'Employee',
  supervisor: 'Supervisor',
  'high-command': 'High Command',
};

export const DIVISION_LABEL: Record<Division, string> = {
  security: 'Security Division',
  research: 'Research Division',
  intelligence: 'Intelligence Division',
};

export const POSITION_LABEL: Record<Position, string> = {
  'trainee-instructor': 'Trainee Instructor',
  'internal-affairs': 'Internal Affairs',
  representative: 'Representative',
  'media-relations': 'Media Relations',
};

export function rankOrder(r: Rank): number {
  return RANKS.indexOf(r);
}

export function nextRank(r: Rank): Rank | null {
  const i = RANKS.indexOf(r);
  return i < RANKS.length - 1 ? RANKS[i + 1] : null;
}

export function prevRank(r: Rank): Rank | null {
  const i = RANKS.indexOf(r);
  return i > 0 ? RANKS[i - 1] : null;
}

export const isRank = (v: unknown): v is Rank => typeof v === 'string' && (RANKS as readonly string[]).includes(v);
export const isDivision = (v: unknown): v is Division => typeof v === 'string' && (DIVISIONS as readonly string[]).includes(v);
export const isPosition = (v: unknown): v is Position => typeof v === 'string' && (POSITIONS as readonly string[]).includes(v);
