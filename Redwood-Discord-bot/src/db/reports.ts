import { db } from '../lib/supabase';

export interface Report {
  id: string;
  shiftId: string;
  discordId: string;
  subject: string;
  body: string;
  createdAt: string;
}

interface Row {
  id: string; shift_id: string; discord_id: string;
  subject: string; body: string; created_at: string;
}

const toReport = (r: Row): Report => ({
  id: r.id, shiftId: r.shift_id, discordId: r.discord_id,
  subject: r.subject, body: r.body, createdAt: r.created_at,
});

export async function addReport(shiftId: string, discordId: string, subject: string, body: string): Promise<void> {
  const { error } = await db().from('reports')
    .insert({ shift_id: shiftId, discord_id: discordId, subject, body });
  if (error) throw error;
}

export async function listReports(limit = 50): Promise<Report[]> {
  const { data, error } = await db().from('reports').select('*')
    .order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data as Row[]).map(toReport);
}
