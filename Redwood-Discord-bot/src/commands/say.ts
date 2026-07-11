import { SlashCommandBuilder, ChannelType } from 'discord.js';
import type { Command } from './types';
import { line } from '../lib/voice';

/** Speak as the bot: post a message to a channel in the company's voice. High Command only. */
const say: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('say').setDescription('Speak as Redwood Peak.')
    .addStringOption((o) => o.setName('message').setDescription('What the company should say').setRequired(true))
    .addChannelOption((o) => o.setName('channel').setDescription('Where to say it (defaults to here)').addChannelTypes(ChannelType.GuildText)) as SlashCommandBuilder,
  async execute(interaction) {
    const text = interaction.options.getString('message', true);
    const picked = interaction.options.getChannel('channel');
    const targetId = picked?.id ?? interaction.channelId;
    const channel = await interaction.guild!.channels.fetch(targetId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildText) {
      return void interaction.editReply({ content: line('err', 'That is not a text channel.') });
    }
    await channel.send(text);
    await interaction.editReply({ content: line('ok', `Said in <#${channel.id}>.`) });
  },
};

export const speechCommands: Command[] = [say];
