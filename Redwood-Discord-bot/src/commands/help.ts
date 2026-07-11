import { SlashCommandBuilder } from 'discord.js';
import type { Command } from './types';
import { helpEmbed, helpComponents } from '../lib/embeds';

export const help: Command = {
  data: new SlashCommandBuilder().setName('help').setDescription('What you can do here, and how.'),
  highCommandOnly: false,
  async execute(interaction) {
    await interaction.editReply({ embeds: [helpEmbed()], components: [helpComponents()] });
  },
};
