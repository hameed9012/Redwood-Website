import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { Command } from './types';
import { line, HANDBOOK_URL } from '../lib/voice';

export const help: Command = {
  data: new SlashCommandBuilder().setName('help').setDescription('The Redwood Peak employee handbook.'),
  highCommandOnly: false,
  async execute(interaction) {
    await interaction.reply({
      content: line('ok', `The employee handbook: ${HANDBOOK_URL}`),
      flags: MessageFlags.Ephemeral,
    });
  },
};
