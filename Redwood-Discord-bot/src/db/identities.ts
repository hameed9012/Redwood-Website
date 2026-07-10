import { db } from '../lib/supabase';
import type { Identity, GeneratedIdentity } from '../lib/identity';

interface Row {
  id: string;
  discord_id: string;
  legal_name: string;
  dob: string;
  ssn: string;
  id_number: string;
  blood_type: string;
  next_of_kin: string;
  issued_at: string;
  status: 'active' | 'retired';
  retired_at: string | null;
}

const toIdentity = (r: Row): Identity => ({
  id: r.id,
  discordId: r.discord_id,
  legalName: r.legal_name,
  dob: r.dob,
  ssn: r.ssn,
  idNumber: r.id_number,
  bloodType: r.blood_type,
  nextOfKin: r.next_of_kin,
  issuedAt: r.issued_at,
  status: r.status,
  retiredAt: r.retired_at,
});

export async function getActiveIdentity(discordId: string): Promise<Identity | null> {
  const { data, error } = await db()
    .from('identities').select('*')
    .eq('discord_id', discordId).eq('status', 'active').maybeSingle();
  if (error) throw error;
  return data ? toIdentity(data as Row) : null;
}

/** Retire any active identity, then insert a fresh active one. Returns the new identity. */
export async function issueIdentity(discordId: string, g: GeneratedIdentity): Promise<Identity> {
  const retire = await db()
    .from('identities').update({ status: 'retired', retired_at: new Date().toISOString() })
    .eq('discord_id', discordId).eq('status', 'active');
  if (retire.error) throw retire.error;

  const { data, error } = await db().from('identities').insert({
    discord_id: discordId,
    legal_name: g.legalName,
    dob: g.dob,
    ssn: g.ssn,
    id_number: g.idNumber,
    blood_type: g.bloodType,
    next_of_kin: g.nextOfKin,
    status: 'active',
  }).select('*').single();
  if (error) throw error;
  return toIdentity(data as Row);
}

export async function listActiveIdentities(): Promise<Identity[]> {
  const { data, error } = await db().from('identities').select('*').eq('status', 'active');
  if (error) throw error;
  return (data as Row[]).map(toIdentity);
}
