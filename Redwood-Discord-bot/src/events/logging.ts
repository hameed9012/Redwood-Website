import {
  Events,
  type GuildMember,
  type PartialGuildMember,
  type Message,
  type PartialMessage,
  type TextChannel,
  type Guild,
} from 'discord.js';
import { config } from '../lib/config';

/** Post a plain log line to the configured log channel, if one is set. */
async function log(guild: Guild, text: string): Promise<void> {
  const cfg = config();
  if (!cfg.channelLog) return;
  const channel = await guild.channels.fetch(cfg.channelLog).catch(() => null);
  if (channel && channel.isTextBased()) {
    (channel as TextChannel).send(text).catch(() => {});
  }
}

function stamp(): string {
  return `<t:${Math.floor(Date.now() / 1000)}:f>`;
}

export const memberJoin = {
  name: Events.GuildMemberAdd as const,
  async execute(member: GuildMember): Promise<void> {
    const age = `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`;
    await log(member.guild, `📥 **Joined** — <@${member.id}> (${member.user.tag}) · account created ${age} · ${stamp()}`);
  },
};

export const memberLeave = {
  name: Events.GuildMemberRemove as const,
  async execute(member: GuildMember | PartialGuildMember): Promise<void> {
    if (!member.guild) return;
    await log(member.guild, `📤 **Left** — <@${member.id}> (${member.user?.tag ?? 'unknown'}) · ${stamp()}`);
  },
};

export const messageDelete = {
  name: Events.MessageDelete as const,
  async execute(message: Message | PartialMessage): Promise<void> {
    if (!message.guild || message.author?.bot) return;
    const who = message.author ? `<@${message.author.id}>` : 'unknown author';
    const body = message.content ? message.content.slice(0, 1800) : '*(no cached content)*';
    await log(message.guild, `🗑️ **Deleted** in <#${message.channelId}> — ${who} · ${stamp()}\n> ${body}`);
  },
};

export const messageEdit = {
  name: Events.MessageUpdate as const,
  async execute(oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage): Promise<void> {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return; // ignore embed-only updates
    const who = newMessage.author ? `<@${newMessage.author.id}>` : 'unknown author';
    const before = oldMessage.content ? oldMessage.content.slice(0, 800) : '*(not cached)*';
    const after = newMessage.content ? newMessage.content.slice(0, 800) : '';
    await log(newMessage.guild, `✏️ **Edited** in <#${newMessage.channelId}> — ${who} · ${stamp()}\n> **Before:** ${before}\n> **After:** ${after}`);
  },
};

export const loggingHandlers = [memberJoin, memberLeave, messageDelete, messageEdit];
