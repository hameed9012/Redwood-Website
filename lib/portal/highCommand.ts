/**
 * High Command lore (Phase 6). Top-clearance material — deadpan, ominous, never
 * explicit. Static; nothing here is real.
 */

// ── Witness Dossiers ─────────────────────────────────────────────────────────
export type DossierStatus = 'watched' | 'relocated' | 'resolved';

export const DOSSIER_STATUS_LABEL: Record<DossierStatus, string> = {
  watched: 'Watched',
  relocated: 'Relocated',
  resolved: 'Resolved',
};

export interface Dossier {
  id: string;
  codename: string;
  status: DossierStatus;
  lastSeen: string;
  role: string;
  summary: string;
  full: string[];
}

// Empty — populate with real dossiers when ready.
export const DOSSIERS: Dossier[] = [];

// ── Command: directives + the deep ledger ────────────────────────────────────
export interface Directive {
  n: number;
  text: string;
}

// Empty — populate with real directives when ready.
export const DIRECTIVES: Directive[] = [];

// The deep ledger is read live from the bot's `ledger_entries` table — see
// lib/portal/command.ts (loadLedger) and app/portal/command/page.tsx.
