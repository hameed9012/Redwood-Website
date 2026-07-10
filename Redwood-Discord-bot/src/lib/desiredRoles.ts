import type { Member } from './member';
import type { BotConfig } from './config';

/** Pure: the exact set of bot-managed role IDs a member should have (rank + divisions + positions). */
export function desiredRoleIds(member: Member, cfg: BotConfig): string[] {
  return [
    cfg.roleForRank[member.rank],
    ...member.divisions.map((d) => cfg.roleForDivision[d]),
    ...member.positions.map((p) => cfg.roleForPosition[p]),
  ];
}

/** All role IDs the bot manages (every rank + division + position). Used to know what to strip. */
export function allManagedRoleIds(cfg: BotConfig): string[] {
  return [
    ...Object.values(cfg.roleForRank),
    ...Object.values(cfg.roleForDivision),
    ...Object.values(cfg.roleForPosition),
  ];
}
