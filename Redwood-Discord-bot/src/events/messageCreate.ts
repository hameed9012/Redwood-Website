import { Events, type Message, type TextChannel } from 'discord.js';
import { config } from '../lib/config';
import { getSecurityConfig } from '../db/config';
import { isSpam } from '../security/heuristics';
import { pushMessage } from './trackers';
import { line } from '../lib/voice';

export const name = Events.MessageCreate;
export async function execute(message: Message): Promise<void> {
  if (message.author.bot || !message.guild) return;
  const cfg = config();
  const now = Date.now();
  const stamps = pushMessage(message.author.id, now);
  const sec = await getSecurityConfig(message.guild.id);

  const massMention = message.mentions.users.size >= 5;
  if (massMention || isSpam(stamps, now, { threshold: sec.spamMsgThreshold, windowSeconds: sec.spamWindowSeconds })) {
    await message.member?.timeout(60_000, 'spam').catch(() => {});
    const securityChannel = await message.guild.channels.fetch(cfg.channelSecurity).catch(() => null);
    if (securityChannel && securityChannel.isTextBased()) {
      (securityChannel as TextChannel).send(line('err', `Flooding detected from <@${message.author.id}>. Timed out.`)).catch(() => {});
    }
  }
}
