import type { Guild, GuildMember } from 'discord.js';
import type { Member } from '../lib/member';
import { config } from '../lib/config';
import { desiredRoleIds, allManagedRoleIds } from '../lib/desiredRoles';
import { upsertMember } from '../db/members';
import { logRosterEvent } from '../db/events';
import { redrawRoster } from './render';

/**
 * The single path every roster mutation goes through. Given the member's NEXT
 * state, it: (1) sets the Discord roles to exactly {rank} ∪ {divisions} ∪
 * {positions} (the role-sync invariant), (2) sets the nickname to the employee
 * name, (3) upserts the DB, (4) logs an audit row, (5) redraws the live roster.
 */
export async function applyRosterChange(
  guild: Guild,
  target: GuildMember,
  next: Member,
  actorDiscordId: string,
  action: string,
  detail?: string,
): Promise<void> {
  const cfg = config();

  if (next.status === 'active') {
    const desired = new Set(desiredRoleIds(next, cfg));
    const managed = allManagedRoleIds(cfg);
    // Add desired managed roles the member lacks; remove managed roles not desired.
    const toAdd = [...desired].filter((id) => !target.roles.cache.has(id));
    const toRemove = managed.filter((id) => !desired.has(id) && target.roles.cache.has(id));
    if (toAdd.length) await target.roles.add(toAdd);
    if (toRemove.length) await target.roles.remove(toRemove);
    await target.setNickname(next.employeeName).catch(() => {}); // may fail on owner/higher roles
  } else {
    // dismissed — strip all managed roles
    const managed = allManagedRoleIds(cfg).filter((id) => target.roles.cache.has(id));
    if (managed.length) await target.roles.remove(managed);
  }

  await upsertMember(next);
  await logRosterEvent(actorDiscordId, next.discordId, action, detail);
  await redrawRoster(guild);
}
