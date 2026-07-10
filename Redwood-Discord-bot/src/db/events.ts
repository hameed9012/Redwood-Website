import { db } from '../lib/supabase';

export async function logRosterEvent(
  actorDiscordId: string,
  targetDiscordId: string,
  action: string,
  detail?: string,
): Promise<void> {
  const { error } = await db().from('roster_events').insert({
    actor_discord_id: actorDiscordId,
    target_discord_id: targetDiscordId,
    action,
    detail: detail ?? null,
  });
  if (error) throw error;
}
