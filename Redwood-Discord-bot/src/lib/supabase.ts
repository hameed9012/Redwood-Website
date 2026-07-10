import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';

let client: SupabaseClient | null = null;

/** Service-role Supabase client. Server-side only — never expose this key to a browser. */
export function db(): SupabaseClient {
  if (!client) {
    const cfg = config();
    client = createClient(cfg.supabaseUrl, cfg.supabaseServiceKey, {
      auth: { persistSession: false },
    });
  }
  return client;
}
