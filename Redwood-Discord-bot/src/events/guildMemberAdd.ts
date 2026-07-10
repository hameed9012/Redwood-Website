import { Events, type GuildMember, type TextChannel } from 'discord.js';
import { config } from '../lib/config';
import { getSecurityConfig, setLockdown } from '../db/config';
import { isRaid, isSuspiciousAccount } from '../security/heuristics';
import { joinTimes, pushJoin } from './trackers';
import { line } from '../lib/voice';

export const name = Events.GuildMemberAdd;
export async function execute(member: GuildMember): Promise<void> {
  const cfg = config();
  const now = Date.now();
  pushJoin(now);
  const sec = await getSecurityConfig(member.guild.id);

  const securityChannel = await member.guild.channels.fetch(cfg.channelSecurity).catch(() => null);
  const alert = (msg: string) => {
    if (securityChannel && securityChannel.isTextBased()) (securityChannel as TextChannel).send(msg).catch(() => {});
  };

  if (isSuspiciousAccount(member.user.createdTimestamp, now, sec.minAccountAgeDays)) {
    alert(line('err', `Suspicious personnel at the perimeter: <@${member.id}> — account age below ${sec.minAccountAgeDays}d.`));
  }
  if (isRaid(joinTimes, now, { threshold: sec.raidJoinThreshold, windowSeconds: sec.raidWindowSeconds })) {
    await setLockdown(member.guild.id, true);
    alert(line('err', 'Raid detected. Lockdown initiated automatically.'));
  }
}
