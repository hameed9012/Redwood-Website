import type { Tier } from './tiers';

/**
 * Secret-name gate (Phase 4). Recognized codenames are stored ONLY as SHA-256
 * hashes — the plaintext names are never in the shipped bundle. We hash the
 * submitted name (trimmed + lowercased) and look it up. Thematically: we keep
 * proof a name was real, not the name.
 *
 * Placeholder codenames ship so the flow is testable — replace these three
 * hashes with the real names' hashes when ready (README documents how):
 *   recruit       → "minnow"
 *   employee      → "tidewater"
 *   high-command  → "leviathan"
 */
export const SECRET_HASHES: Record<string, Tier> = {
  '616bebcf52b9382c7741322b835bb7c56cf5e64298b80988ea934800f4beb843': 'recruit',
  'b9fba08ee529cff7439666177a2755ff511120510dc4d21e1f3fe8fbd424bd5e': 'employee',
  '79866542834f9e05f768857f3b748f72accada66fa41634ae641d861efd2cda9': 'high-command',
};

/** SHA-256 hex of the normalized (trimmed, lowercased) secret name. */
export async function hashSecretName(name: string): Promise<string> {
  const normalized = name.trim().toLowerCase();
  const data = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Resolve a submitted secret name to its tier, or null if unrecognized. */
export async function resolveTier(name: string): Promise<Tier | null> {
  if (!name.trim()) return null;
  const hash = await hashSecretName(name);
  return SECRET_HASHES[hash] ?? null;
}
