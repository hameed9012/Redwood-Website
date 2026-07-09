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

export const DOSSIERS: Dossier[] = [
  {
    id: 'D-207',
    codename: 'HERON',
    status: 'watched',
    lastSeen: '2026-06-29 · River Bend',
    role: 'Independent surveyor',
    summary: 'Requested a second river sample. Was told the schedule is full.',
    full: [
      'Contracted to conduct an independent survey of the water. Persistent. Has requested the same permit four times.',
      'Community Relations has postponed the survey on each occasion. HERON has begun taking samples without a permit.',
      'Recommendation: continue to postpone. Escort at the shoreline. Note the samples do not reach a lab.',
    ],
  },
  {
    id: 'D-204',
    codename: 'MAGPIE',
    status: 'relocated',
    lastSeen: '2026-06-20 · (out of area)',
    role: 'Former Night Dispatch',
    summary: 'Kept a private copy of the manifests. No longer with the company.',
    full: [
      'Retained duplicates of sealed manifests against policy. Confronted; cooperative.',
      'Accepted a generous relocation package to another region. Signed the appropriate documents.',
      'The duplicates were recovered. All of them. This matter is closed.',
    ],
  },
  {
    id: 'D-198',
    codename: 'WREN JR.',
    status: 'watched',
    lastSeen: '2026-06-28 · Town square',
    role: 'Local journalist',
    summary: 'Asked, at the food truck, what we transport. Was told: industrial solvent.',
    full: [
      'Attends every community event. Friendly. Takes notes.',
      'Has filed two records requests with local government. Press & Local Government is handling both.',
      'Recommendation: keep smiling. Keep the aprons on. Do not improvise.',
    ],
  },
  {
    id: 'D-191',
    codename: 'THE SWIMMER',
    status: 'resolved',
    lastSeen: '—',
    role: '—',
    summary: 'Was seen at the shoreline before dawn. Was not seen after.',
    full: [
      'Observed at the water outside permitted hours. Did not respond to an escort.',
      'Site Maintenance attended. The shoreline was clear by the time the survey team was due.',
      'This dossier is retained for reference only. Do not re-open at a lower clearance.',
    ],
  },
];

// ── Command: directives + the deep ledger ────────────────────────────────────
export interface Directive {
  n: number;
  text: string;
}

export const DIRECTIVES: Directive[] = [
  { n: 1, text: 'The water is a company asset. It is not surveyed by outsiders. Ever.' },
  { n: 2, text: 'Every manifest lists industrial solvent. There are no exceptions to write down.' },
  { n: 3, text: 'The north gate is kept by one person. It is opened for no one else.' },
  { n: 4, text: 'A dossier moved to Resolved is not discussed, not re-opened, and not counted.' },
  { n: 5, text: 'If the survey ever happens, it happens on our sample. Only our sample.' },
];

export interface LedgerEntry {
  id: string;
  date: string;
  direction: 'in' | 'out';
  amount: number;
  counterparty: string;
  redacted?: boolean;
  note?: string;
}

export const LEDGER: LedgerEntry[] = [
  { id: 'L-882', date: '2026-06-30', direction: 'in', amount: 240000, counterparty: 'Contract — bulk', redacted: true },
  { id: 'L-879', date: '2026-06-29', direction: 'out', amount: 18000, counterparty: 'Community Relations', note: 'Cleanups, food trucks, aprons.' },
  { id: 'L-877', date: '2026-06-28', direction: 'out', amount: 55000, counterparty: 'Relocation — MAGPIE' },
  { id: 'L-874', date: '2026-06-27', direction: 'in', amount: 310000, counterparty: 'Contract — bulk', redacted: true },
  { id: 'L-870', date: '2026-06-25', direction: 'out', amount: 9000, counterparty: 'Site Maintenance — shoreline' },
  { id: 'L-866', date: '2026-06-24', direction: 'in', amount: 0, counterparty: 'Balance', note: 'The totals do not reconcile. They are not meant to.' },
];
