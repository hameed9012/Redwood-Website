/**
 * Operations Log (Phase 5) — nightly runs + shipment manifests. Pure lore data
 * plus the filter/sort helpers behind the table's controls. Static; nothing
 * here is real and nothing persists.
 */
export type RunStatus = 'delivered' | 'in-transit' | 'held' | 'redacted';

export interface Run {
  id: string;
  date: string; // ISO yyyy-mm-dd
  route: string;
  tanker: string;
  cargo: string;
  tonnage: number;
  status: RunStatus;
  note?: string;
}

export const RUN_STATUS_LABEL: Record<RunStatus, string> = {
  delivered: 'Delivered',
  'in-transit': 'In transit',
  held: 'Held',
  redacted: '—',
};

export const OPS_RUNS: Run[] = [
  { id: 'RUN-4471', date: '2026-06-30', route: 'North Gate → Mill Road', tanker: 'RW-Tanker 3', cargo: 'Industrial solvent', tonnage: 18.4, status: 'delivered' },
  { id: 'RUN-4470', date: '2026-06-30', route: 'Valley Drive → River Bend', tanker: 'RW-Tanker 1', cargo: 'Industrial solvent', tonnage: 22.0, status: 'redacted', note: 'Manifest sealed. Do not re-open.' },
  { id: 'RUN-4468', date: '2026-06-29', route: 'River Bend → North Gate', tanker: 'RW-Tanker 3', cargo: 'Industrial solvent', tonnage: 0.0, status: 'held', note: 'Weigh station closed early. Held overnight at the lot.' },
  { id: 'RUN-4465', date: '2026-06-28', route: 'Mill Road → Valley Drive', tanker: 'RW-Tanker 2', cargo: 'Industrial solvent', tonnage: 19.7, status: 'delivered' },
  { id: 'RUN-4463', date: '2026-06-28', route: 'North Gate → River Bend', tanker: 'RW-Tanker 1', cargo: 'Industrial solvent', tonnage: 24.1, status: 'delivered' },
  { id: 'RUN-4460', date: '2026-06-27', route: 'River Bend → North Gate', tanker: 'RW-Tanker 3', cargo: 'Cleaning supplies', tonnage: 6.2, status: 'delivered', note: 'Community cleanup materials. Incinerate remainder.' },
  { id: 'RUN-4458', date: '2026-06-27', route: 'Valley Drive → Mill Road', tanker: 'RW-Tanker 2', cargo: 'Industrial solvent', tonnage: 20.5, status: 'in-transit' },
  { id: 'RUN-4455', date: '2026-06-26', route: 'North Gate → Mill Road', tanker: 'RW-Tanker 1', cargo: 'Industrial solvent', tonnage: 21.3, status: 'redacted', note: 'Manifest sealed. Do not re-open.' },
  { id: 'RUN-4451', date: '2026-06-25', route: 'Mill Road → River Bend', tanker: 'RW-Tanker 2', cargo: 'Industrial solvent', tonnage: 17.9, status: 'delivered' },
  { id: 'RUN-4448', date: '2026-06-24', route: 'River Bend → Valley Drive', tanker: 'RW-Tanker 3', cargo: 'Industrial solvent', tonnage: 23.6, status: 'delivered' },
];

export type StatusFilter = RunStatus | 'all';
export type SortDir = 'asc' | 'desc';

/** Filter by status ('all' = no filter), then sort by date. Pure; never mutates. */
export function selectRuns(runs: Run[], status: StatusFilter, sort: SortDir): Run[] {
  const filtered = status === 'all' ? runs : runs.filter((r) => r.status === status);
  const sorted = filtered.slice().sort((a, b) => a.date.localeCompare(b.date));
  return sort === 'desc' ? sorted.reverse() : sorted;
}
