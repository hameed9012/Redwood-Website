import { SlashCommandBuilder } from 'discord.js';
import type { Command } from './types';
import { line } from '../lib/voice';
import { config } from '../lib/config';
import { setLockdown, setDeadmanDeadline } from '../db/config';
import { lockdownEmbed } from '../lib/embeds';

const lockdown: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('lockdown').setDescription('Seal or open the server.')
    .addStringOption((o) => o.setName('state').setDescription('on or off').setRequired(true)
      .addChoices({ name: 'on', value: 'on' }, { name: 'off', value: 'off' })) as SlashCommandBuilder,
  async execute(interaction) {
    const on = interaction.options.getString('state', true) === 'on';
    const everyone = interaction.guild!.roles.everyone;
    for (const [, channel] of await interaction.guild!.channels.fetch()) {
      if (channel && channel.isTextBased() && 'permissionOverwrites' in channel) {
        await channel.permissionOverwrites.edit(everyone, { SendMessages: on ? false : null }).catch(() => {});
      }
    }
    await setLockdown(interaction.guild!.id, on);
    await interaction.editReply({ embeds: [lockdownEmbed(on)] });
  },
};

const deadman: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('deadman').setDescription("Reset the dead-man's switch.")
    .addSubcommand((s) => s.setName('reset').setDescription('Reset the timer.')) as SlashCommandBuilder,
  async execute(interaction) {
    const cfg = config();
    const deadline = new Date(Date.now() + cfg.deadmanIntervalHours * 3_600_000).toISOString();
    await setDeadmanDeadline(interaction.guild!.id, deadline);
    await interaction.editReply({ content: line('ok', `Acknowledged. The switch is reset for ${cfg.deadmanIntervalHours}h.`) });
  },
};

export const securityCommands: Command[] = [lockdown, deadman];
