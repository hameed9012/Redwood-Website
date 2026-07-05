import { TIER_LABEL, type Tier } from '@/lib/auth/tiers';

const STYLES: Record<Tier, string> = {
  recruit: 'border-rw-bone/25 text-rw-bone/70',
  employee: 'border-rw-red/50 text-rw-red',
  'high-command': 'border-rw-red bg-rw-red/10 text-rw-red',
};

/** Small clearance chip shown in the portal. */
export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${STYLES[tier]}`}
    >
      {TIER_LABEL[tier]}
    </span>
  );
}
