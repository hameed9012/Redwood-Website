import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import ws from 'ws';
import { config } from './config';

// Node < 22 has no global WebSocket. supabase-js constructs a realtime client on
// createClient() that demands one — even though we never use realtime — and throws
// without it. Provide the `ws` implementation so the client can be built.
if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
  (globalThis as { WebSocket?: unknown }).WebSocket = ws;
}

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
