import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { Command } from './types';
import { HANDBOOK } from '../lib/voice';

export const help: Command = {
  data: new SlashCommandBuilder().setName('help').setDescription('The Redwood Peak employee handbook.'),
  highCommandOnly: false,
  async execute(interaction) {
    await interaction.reply({ content: HANDBOOK, flags: MessageFlags.Ephemeral });
  },
};
