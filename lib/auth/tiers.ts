/**
 * Access tiers for the employee area (Phase 4). Strictly ranked: a higher tier
 * can see everything a lower tier can. Pure — no storage, no React.
 */
export type Tier = 'recruit' | 'employee' | 'high-command';

export const TIERS: readonly Tier[] = ['recruit', 'employee', 'high-command'] as const;

export const TIER_RANK: Record<Tier, number> = {
  recruit: 1,
  employee: 2,
  'high-command': 3,
};

export const TIER_LABEL: Record<Tier, string> = {
  recruit: 'Recruit',
  employee: 'Employee',
  'high-command': 'High Command',
};

/** True when `current` meets or exceeds `required`. A null/undefined tier never qualifies. */
export function hasAtLeast(current: Tier | null | undefined, required: Tier): boolean {
  if (!current) return false;
  return TIER_RANK[current] >= TIER_RANK[required];
}
