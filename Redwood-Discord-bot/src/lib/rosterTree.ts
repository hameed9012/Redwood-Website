import { RANKS, RANK_LABEL, DIVISION_LABEL, POSITION_LABEL, type Rank } from './ranks';
import type { Member } from './member';

function memberLine(member: Member): string {
  const divs = member.divisions.map((d) => DIVISION_LABEL[d]);
  const pos = member.positions.map((p) => POSITION_LABEL[p]);
  let line = member.employeeName;
  if (divs.length) line += ` — ${divs.join(', ')}`;
  if (pos.length) line += `  [${pos.join(', ')}]`;
  return ` └─ ${line}`;
}

/** Pure: the roster body, grouped by rank (High Command first). Dismissed members omitted. */
export function renderRoster(members: Member[]): string {
  const active = members.filter((m) => m.status === 'active');
  const ranksTopDown: Rank[] = [...RANKS].reverse();

  const blocks = ranksTopDown.map((rank) => {
    const inRank = active
      .filter((m) => m.rank === rank)
      .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
    const body = inRank.length ? inRank.map(memberLine).join('\n') : ' └─ (none)';
    return `${RANK_LABEL[rank]}\n${body}`;
  });

  return `REDWOOD PEAK · ROSTER\n\n${blocks.join('\n')}`;
}
