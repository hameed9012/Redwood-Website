import { db } from '../lib/supabase';

export interface Shift {
  id: string;
  discordId: string;
  identityId: string | null;
  startedAt: string;
  endedAt: string | null;
  status: 'open' | 'closed';
  movementAccount: string | null;
}

interface Row {
  id: string;
  discord_id: string;
  identity_id: string | null;
  started_at: string;
  ended_at: string | null;
  status: 'open' | 'closed';
  movement_account: string | null;
}

const toShift = (r: Row): Shift => ({
  id: r.id,
  discordId: r.discord_id,
  identityId: r.identity_id,
  startedAt: r.started_at,
  endedAt: r.ended_at,
  status: r.status,
  movementAccount: r.movement_account,
});

export async function getOpenShift(discordId: string): Promise<Shift | null> {
  const { data, error } = await db()
    .from('shifts').select('*')
    .eq('discord_id', discordId).eq('status', 'open').maybeSingle();
  if (error) throw error;
  return data ? toShift(data as Row) : null;
}

export async function startShift(discordId: string, identityId: string | null): Promise<Shift> {
  const { data, error } = await db().from('shifts')
    .insert({ discord_id: discordId, identity_id: identityId, status: 'open' })
    .select('*').single();
  if (error) throw error;
  return toShift(data as Row);
}

export async function closeShift(shiftId: string, movementAccount: string): Promise<void> {
  const { error } = await db().from('shifts')
    .update({ status: 'closed', ended_at: new Date().toISOString(), movement_account: movementAccount })
    .eq('id', shiftId);
  if (error) throw error;
}

/** Closed shifts, newest first, capped. */
export async function listClosedShifts(limit = 50): Promise<Shift[]> {
  const { data, error } = await db().from('shifts').select('*')
    .eq('status', 'closed').order('ended_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data as Row[]).map(toShift);
}
