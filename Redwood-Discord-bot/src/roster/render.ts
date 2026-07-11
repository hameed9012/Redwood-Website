import type { Guild } from 'discord.js';
import { rosterEmbed } from '../lib/embeds';
import { listActiveMembers } from '../db/members';
import { getRosterConfig } from '../db/config';

/** Rebuild the live roster message from the DB. No-op if roster hasn't been set up. */
export async function redrawRoster(guild: Guild): Promise<void> {
  const cfg = await getRosterConfig(guild.id);
  if (!cfg.channelId || !cfg.messageId) return;
  const channel = await guild.channels.fetch(cfg.channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;
  const message = await channel.messages.fetch(cfg.messageId).catch(() => null);
  if (!message) return;
  await message.edit({ content: '', embeds: [rosterEmbed(await listActiveMembers())] });
}
