import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client using the SERVICE ROLE key. Never import this from
 * a client component — the `server-only` guard turns that into a build error.
 * Reads bot-written tables for the portal pages.
 */
let cached: SupabaseClient | null | undefined;

/** Decode the `role` claim of a Supabase JWT key. Returns null for non-JWT keys
 *  (e.g. the newer `sb_publishable_…` / `sb_secret_…` formats) so we don't warn
 *  on keys we can't introspect. */
function jwtRole(key: string | undefined): string | null {
  if (!key || key.split('.').length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString('utf8'));
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

/** One-time key sanity check. Server-only, so nothing here reaches the browser.
 *  Catches the mistake that broke the portal: a non-service key server-side
 *  (RLS-locked tables read empty) or the service key leaked into the public var. */
let checked = false;
function auditKeys(): void {
  if (checked) return;
  checked = true;
  const serviceRole = jwtRole(process.env.SUPABASE_SERVICE_KEY);
  if (serviceRole && serviceRole !== 'service_role') {
    console.error(
      `[serverClient] SUPABASE_SERVICE_KEY has role "${serviceRole}", expected "service_role". ` +
        'Server reads are subject to RLS — RLS-locked tables (incident_parties, reports) will return empty. ' +
        'Set SUPABASE_SERVICE_KEY to the project\'s service_role key.',
    );
  }
  if (jwtRole(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) === 'service_role') {
    console.error(
      '[serverClient] SECURITY: NEXT_PUBLIC_SUPABASE_ANON_KEY is a service_role key. ' +
        'This is inlined into the browser bundle — rotate it immediately and replace it with the anon key.',
    );
  }
}

export function serverDb(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  auditKeys();
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  cached = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return cached;
}
