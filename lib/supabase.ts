import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Lazy browser Supabase client (Phase 3 — the project's first Supabase touch).
 * Shim-first: if the two public env vars are absent the client is null and the
 * contact form still works visually (the reference number is shown, the row is
 * simply not stored). Wire real creds in .env.local (see supabase/schema.sql)
 * and inserts go live with zero code change.
 */
let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  cached = url && key ? createClient(url, key) : null;
  return cached;
}

export interface ContactInquiry {
  discord_username: string;
  message: string | null;
  reference: string;
}

/**
 * Store a contact inquiry. Returns true if it was inserted, false if skipped
 * (no creds) or on any error. The caller ALWAYS shows the reference number
 * regardless — the theatre never breaks on a storage failure (spec §4.4).
 */
export async function submitInquiry(row: ContactInquiry): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('contact_inquiries').insert(row);
    if (error) {
      console.warn('[contact] insert failed:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[contact] insert threw:', e);
    return false;
  }
}
