import { db } from '../lib/supabase';
import type { ReputationLite } from '../lib/reputation';

interface RepRow { discord_id: string; kind: 'commendation' | 'writeup'; reason: string; created_at: string; }
const toRep = (r: RepRow): ReputationLite => ({ discordId: r.discord_id, kind: r.kind, reason: r.reason, createdAt: r.created_at });

export async function addReputation(identityId: string, discordId: string, kind: 'commendation' | 'writeup', reason: string, issuedBy: string): Promise<void> {
  const { error } = await db().from('reputation').insert({ identity_id: identityId, discord_id: discordId, kind, reason, issued_by: issuedBy });
  if (error) throw error;
}

/** Active-identity ids for a set of members. */
async function activeIdentityIds(discordIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!discordIds.length) return map;
  const { data, error } = await db().from('identities').select('id, discord_id').eq('status', 'active').in('discord_id', discordIds);
  if (error) throw error;
  for (const r of (data ?? []) as { id: string; discord_id: string }[]) map.set(r.discord_id, r.id);
  return map;
}

export async function reputationForActiveMember(discordId: string): Promise<ReputationLite[]> {
  const ids = await activeIdentityIds([discordId]);
  const idn = ids.get(discordId);
  if (!idn) return [];
  const { data, error } = await db().from('reputation').select('discord_id, kind, reason, created_at').eq('identity_id', idn);
  if (error) throw error;
  return ((data ?? []) as RepRow[]).map(toRep);
}

export async function reputationForActiveMembers(discordIds: string[]): Promise<ReputationLite[]> {
  const ids = await activeIdentityIds(discordIds);
  const identityIds = [...ids.values()];
  if (!identityIds.length) return [];
  const { data, error } = await db().from('reputation').select('discord_id, kind, reason, created_at').in('identity_id', identityIds);
  if (error) throw error;
  return ((data ?? []) as RepRow[]).map(toRep);
}

/** Mark the member's active identity 'burned'. The caller then mints fresh papers. */
export async function burnActiveIdentity(discordId: string): Promise<void> {
  const { error } = await db().from('identities')
    .update({ status: 'burned', retired_at: new Date().toISOString() })
    .eq('discord_id', discordId).eq('status', 'active');
  if (error) throw error;
}
