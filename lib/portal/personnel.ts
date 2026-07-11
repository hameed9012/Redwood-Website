import { serverDb } from './serverClient';
import { RANKS, RANK_LABEL, DIVISION_LABEL, POSITION_LABEL, type Rank, type Division, type Position } from './orgLabels';

export interface PersonnelRow {
  employeeName: string;
  rank: Rank;
  divisions: Division[];
  positions: Position[];
}

export interface RankGroup {
  rank: Rank;
  label: string;
  members: { employeeName: string; divisions: string[]; positions: string[] }[];
}

/** Group the roster by rank, high-command first, trainee last. Pure. */
export function groupByRank(rows: PersonnelRow[]): RankGroup[] {
  const order: Rank[] = ['high-command', 'supervisor', 'employee', 'trainee'];
  return order.map((rank) => ({
    rank,
    label: RANK_LABEL[rank],
    members: rows
      .filter((r) => r.rank === rank)
      .map((r) => ({
        employeeName: r.employeeName,
        divisions: r.divisions.map((d) => DIVISION_LABEL[d]),
        positions: r.positions.map((p) => POSITION_LABEL[p]),
      })),
  }));
}

/** Server-side load of the active roster. Returns [] if creds are absent. */
export async function loadPersonnel(): Promise<RankGroup[]> {
  const db = serverDb();
  if (!db) return groupByRank([]);
  const { data, error } = await db.from('members')
    .select('employee_name, rank, divisions, positions').eq('status', 'active');
  if (error) throw error;
  const rows: PersonnelRow[] = (data ?? []).map((r: {
    employee_name: string; rank: Rank; divisions: Division[] | null; positions: Position[] | null;
  }) => ({
    employeeName: r.employee_name,
    rank: r.rank,
    divisions: r.divisions ?? [],
    positions: r.positions ?? [],
  }));
  // Keep only known ranks (defensive).
  return groupByRank(rows.filter((r) => (RANKS as readonly string[]).includes(r.rank)));
}
