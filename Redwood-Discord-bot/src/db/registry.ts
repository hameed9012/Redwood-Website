import { db } from '../lib/supabase';
import type { FirearmLite, VehicleLite } from '../lib/lookup';

interface FRow { serial: string; kind: string; discord_id: string; status: 'clean' | 'flagged'; flag_note: string | null; issued_at: string; }
interface VRow { plate: string; description: string; discord_id: string; status: 'clean' | 'flagged'; flag_note: string | null; issued_at: string; }

const SELF = 'serial, kind, discord_id, status, flag_note, issued_at';
const SELV = 'plate, description, discord_id, status, flag_note, issued_at';

/** Resolve owner cover legal name + employee name for a set of discord ids (their active identity). */
async function owners(discordIds: string[]): Promise<Map<string, { cover: string; employee: string }>> {
  const map = new Map<string, { cover: string; employee: string }>();
  const ids = [...new Set(discordIds)];
  if (!ids.length) return map;
  const [{ data: mem }, { data: idn }] = await Promise.all([
    db().from('members').select('discord_id, employee_name').in('discord_id', ids),
    db().from('identities').select('discord_id, legal_name').eq('status', 'active').in('discord_id', ids),
  ]);
  const empOf = new Map((mem ?? []).map((m: { discord_id: string; employee_name: string }) => [m.discord_id, m.employee_name]));
  const covOf = new Map((idn ?? []).map((i: { discord_id: string; legal_name: string }) => [i.discord_id, i.legal_name]));
  for (const id of ids) map.set(id, { cover: covOf.get(id) ?? '—', employee: empOf.get(id) ?? 'Unknown' });
  return map;
}

const toFirearm = (r: FRow, o: Map<string, { cover: string; employee: string }>): FirearmLite => ({ serial: r.serial, kind: r.kind, discordId: r.discord_id, status: r.status, flagNote: r.flag_note, issuedAt: r.issued_at, ownerCover: o.get(r.discord_id)?.cover ?? '—', ownerEmployee: o.get(r.discord_id)?.employee ?? 'Unknown' });
const toVehicle = (r: VRow, o: Map<string, { cover: string; employee: string }>): VehicleLite => ({ plate: r.plate, description: r.description, discordId: r.discord_id, status: r.status, flagNote: r.flag_note, issuedAt: r.issued_at, ownerCover: o.get(r.discord_id)?.cover ?? '—', ownerEmployee: o.get(r.discord_id)?.employee ?? 'Unknown' });

export async function registerFirearm(serial: string, kind: string, discordId: string, identityId: string): Promise<void> {
  const { error } = await db().from('firearms').insert({ serial, kind, discord_id: discordId, identity_id: identityId });
  if (error) throw error;
}
export async function registerVehicle(plate: string, description: string, discordId: string, identityId: string): Promise<void> {
  const { error } = await db().from('vehicles').insert({ plate, description, discord_id: discordId, identity_id: identityId });
  if (error) throw error;
}
export async function vehicleExists(plate: string): Promise<boolean> {
  const { data, error } = await db().from('vehicles').select('plate').ilike('plate', plate).maybeSingle();
  if (error) throw error;
  return !!data;
}

/** Flag/clear a firearm (by serial) or vehicle (by plate). Returns 'firearm'|'vehicle'|null. */
export async function flagItem(identifier: string, status: 'clean' | 'flagged', note: string | null): Promise<'firearm' | 'vehicle' | null> {
  const f = await db().from('firearms').update({ status, flag_note: note }).ilike('serial', identifier).select('serial');
  if (f.error) throw f.error;
  if ((f.data ?? []).length) return 'firearm';
  const v = await db().from('vehicles').update({ status, flag_note: note }).ilike('plate', identifier).select('plate');
  if (v.error) throw v.error;
  if ((v.data ?? []).length) return 'vehicle';
  return null;
}

export async function firearmsForMember(discordId: string): Promise<FirearmLite[]> {
  const { data, error } = await db().from('firearms').select(SELF).eq('discord_id', discordId);
  if (error) throw error;
  const rows = (data ?? []) as FRow[];
  const o = await owners(rows.map((r) => r.discord_id));
  return rows.map((r) => toFirearm(r, o));
}
export async function vehiclesForMember(discordId: string): Promise<VehicleLite[]> {
  const { data, error } = await db().from('vehicles').select(SELV).eq('discord_id', discordId);
  if (error) throw error;
  const rows = (data ?? []) as VRow[];
  const o = await owners(rows.map((r) => r.discord_id));
  return rows.map((r) => toVehicle(r, o));
}

/** For text lookups: exact serial + plate matches, with owner names resolved. */
export async function registryMatches(text: string): Promise<{ firearms: FirearmLite[]; vehicles: VehicleLite[] }> {
  const [f, v] = await Promise.all([
    db().from('firearms').select(SELF).ilike('serial', text),
    db().from('vehicles').select(SELV).ilike('plate', text),
  ]);
  if (f.error) throw f.error; if (v.error) throw v.error;
  const fRows = (f.data ?? []) as FRow[];
  const vRows = (v.data ?? []) as VRow[];
  const o = await owners([...fRows.map((r) => r.discord_id), ...vRows.map((r) => r.discord_id)]);
  return { firearms: fRows.map((r) => toFirearm(r, o)), vehicles: vRows.map((r) => toVehicle(r, o)) };
}
