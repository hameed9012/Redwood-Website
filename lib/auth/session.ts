import { TIER_RANK, type Tier } from './tiers';

export interface AuthSession {
  tier: Tier;
  /** The secret name used (kept only client-side, for the greeting). */
  name: string;
  /** Epoch ms of sign-in. */
  at: number;
}

const STORAGE_KEY = 'rw.session';

function isTier(v: unknown): v is Tier {
  return typeof v === 'string' && v in TIER_RANK;
}

/** Read the persisted session, or null. SSR-safe and tolerant of corrupt data. */
export function readSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (!isTier(parsed.tier) || typeof parsed.name !== 'string') return null;
    return { tier: parsed.tier, name: parsed.name, at: typeof parsed.at === 'number' ? parsed.at : Date.now() };
  } catch {
    return null;
  }
}

export function writeSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* storage unavailable (private mode / quota) — session simply won't persist */
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
