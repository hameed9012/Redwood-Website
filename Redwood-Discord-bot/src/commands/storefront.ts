import { SlashCommandBuilder, ChannelType } from 'discord.js';
import type { Command } from './types';
import { line } from '../lib/voice';
import { storefrontEmbed, storefrontButtons } from '../lib/storefront';

const storefront: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder()
    .setName('storefront')
    .setDescription('The public face of the company.')
    .addSubcommand((s) =>
      s
        .setName('post')
        .setDescription('Post the storefront embed with order + donate buttons.')
        .addChannelOption((o) =>
          o
            .setName('channel')
            .setDescription('Where to post it')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText),
        ),
    ) as SlashCommandBuilder,
  async execute(interaction) {
    const target = interaction.options.getChannel('channel', true);
    const ch = await interaction.client.channels.fetch(target.id).catch(() => null);
    if (!ch || ch.type !== ChannelType.GuildText) {
      await interaction.editReply({ content: line('err', 'Pick a normal text channel.') });
      return;
    }
    await ch.send({ embeds: [storefrontEmbed()], components: [storefrontButtons()] });
    await interaction.editReply({ content: line('ok', `Storefront posted in ${ch}.`) });
  },
};

export const storefrontCommands: Command[] = [storefront];
