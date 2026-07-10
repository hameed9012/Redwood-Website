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

// Empty — populate with real runs when ready. The table shows an empty state until then.
export const OPS_RUNS: Run[] = [];

export type StatusFilter = RunStatus | 'all';
export type SortDir = 'asc' | 'desc';

/** Filter by status ('all' = no filter), then sort by date. Pure; never mutates. */
export function selectRuns(runs: Run[], status: StatusFilter, sort: SortDir): Run[] {
  const filtered = status === 'all' ? runs : runs.filter((r) => r.status === status);
  const sorted = filtered.slice().sort((a, b) => a.date.localeCompare(b.date));
  return sort === 'desc' ? sorted.reverse() : sorted;
}
