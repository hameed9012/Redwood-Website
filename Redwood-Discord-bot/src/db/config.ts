import { db } from '../lib/supabase';

export interface RosterConfig { channelId: string | null; messageId: string | null; }

export async function getRosterConfig(guildId: string): Promise<RosterConfig> {
  const { data, error } = await db().from('roster_config').select('*').eq('guild_id', guildId).maybeSingle();
  if (error) throw error;
  return { channelId: data?.channel_id ?? null, messageId: data?.message_id ?? null };
}

export async function setRosterConfig(guildId: string, channelId: string, messageId: string): Promise<void> {
  const { error } = await db().from('roster_config').upsert({ guild_id: guildId, channel_id: channelId, message_id: messageId });
  if (error) throw error;
}

export interface SecurityConfig {
  lockdown: boolean;
  deadmanDeadline: string | null;
  raidJoinThreshold: number;
  raidWindowSeconds: number;
  spamMsgThreshold: number;
  spamWindowSeconds: number;
  minAccountAgeDays: number;
}

const DEFAULT_SECURITY: Omit<SecurityConfig, 'lockdown' | 'deadmanDeadline'> = {
  raidJoinThreshold: 5, raidWindowSeconds: 10, spamMsgThreshold: 6, spamWindowSeconds: 5, minAccountAgeDays: 7,
};

export async function getSecurityConfig(guildId: string): Promise<SecurityConfig> {
  const { data, error } = await db().from('security_config').select('*').eq('guild_id', guildId).maybeSingle();
  if (error) throw error;
  if (!data) return { lockdown: false, deadmanDeadline: null, ...DEFAULT_SECURITY };
  return {
    lockdown: data.lockdown,
    deadmanDeadline: data.deadman_deadline,
    raidJoinThreshold: data.raid_join_threshold,
    raidWindowSeconds: data.raid_window_seconds,
    spamMsgThreshold: data.spam_msg_threshold,
    spamWindowSeconds: data.spam_window_seconds,
    minAccountAgeDays: data.min_account_age_days,
  };
}

export async function setLockdown(guildId: string, on: boolean): Promise<void> {
  const { error } = await db().from('security_config').upsert({ guild_id: guildId, lockdown: on });
  if (error) throw error;
}

export async function setDeadmanDeadline(guildId: string, deadlineIso: string): Promise<void> {
  const { error } = await db().from('security_config').upsert({ guild_id: guildId, deadman_deadline: deadlineIso });
  if (error) throw error;
}
