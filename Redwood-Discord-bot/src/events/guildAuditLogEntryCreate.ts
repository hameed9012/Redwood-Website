import { Events, AuditLogEvent, type GuildAuditLogsEntry, type Guild, type TextChannel } from 'discord.js';
import { config } from '../lib/config';
import { line } from '../lib/voice';

const WATCHED = new Set<number>([
  AuditLogEvent.ChannelDelete,
  AuditLogEvent.RoleDelete,
  AuditLogEvent.MemberBanAdd,
  AuditLogEvent.MemberKick,
]);

export const name = Events.GuildAuditLogEntryCreate;
export async function execute(entry: GuildAuditLogsEntry, guild: Guild): Promise<void> {
  if (!WATCHED.has(entry.action)) return;
  const cfg = config();
  const hc = await guild.channels.fetch(cfg.channelHighCommand).catch(() => null);
  if (hc && hc.isTextBased()) {
    (hc as TextChannel).send(line('err', `Mass-action alert: <@${entry.executorId}> performed \`${AuditLogEvent[entry.action]}\`. Review advised.`)).catch(() => {});
  }
}
