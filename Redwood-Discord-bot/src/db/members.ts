import { db } from '../lib/supabase';
import type { Member } from '../lib/member';
import type { Rank, Division, Position } from '../lib/ranks';

interface Row {
  discord_id: string;
  employee_name: string;
  rank: Rank;
  divisions: Division[];
  positions: Position[];
  status: 'active' | 'dismissed';
  joined_at: string;
  updated_at: string;
}

const toMember = (r: Row): Member => ({
  discordId: r.discord_id,
  employeeName: r.employee_name,
  rank: r.rank,
  divisions: r.divisions ?? [],
  positions: r.positions ?? [],
  status: r.status,
  joinedAt: r.joined_at,
  updatedAt: r.updated_at,
});

export async function getMember(discordId: string): Promise<Member | null> {
  const { data, error } = await db().from('members').select('*').eq('discord_id', discordId).maybeSingle();
  if (error) throw error;
  return data ? toMember(data as Row) : null;
}

export async function listActiveMembers(): Promise<Member[]> {
  const { data, error } = await db().from('members').select('*').eq('status', 'active');
  if (error) throw error;
  return (data as Row[]).map(toMember);
}

export async function upsertMember(m: Member): Promise<void> {
  const { error } = await db().from('members').upsert({
    discord_id: m.discordId,
    employee_name: m.employeeName,
    rank: m.rank,
    divisions: m.divisions,
    positions: m.positions,
    status: m.status,
    joined_at: m.joinedAt,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
