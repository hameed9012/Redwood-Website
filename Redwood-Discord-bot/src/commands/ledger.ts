import { SlashCommandBuilder } from 'discord.js';
import type { Command } from './types';
import { line } from '../lib/voice';
import { formatMoney, computeBalances, type Direction, type Book } from '../lib/ledger';
import { addLedgerEntry, listEntries } from '../db/ledger';
import { ledgerEmbed } from '../lib/embeds';

const ledger: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('ledger').setDescription('The company books.')
    .addSubcommand((s) => s.setName('record').setDescription('Record a ledger entry.')
      .addIntegerOption((o) => o.setName('amount').setDescription('Whole dollars').setRequired(true).setMinValue(1))
      .addStringOption((o) => o.setName('direction').setDescription('inflow or outflow').setRequired(true)
        .addChoices({ name: 'inflow', value: 'inflow' }, { name: 'outflow', value: 'outflow' }))
      .addStringOption((o) => o.setName('book').setDescription('white or black').setRequired(true)
        .addChoices({ name: 'white', value: 'white' }, { name: 'black', value: 'black' }))
      .addStringOption((o) => o.setName('reason').setDescription('What for').setRequired(true)))
    .addSubcommand((s) => s.setName('summary').setDescription('Show the balances.')) as SlashCommandBuilder,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'record') {
      const amount = interaction.options.getInteger('amount', true);
      const direction = interaction.options.getString('direction', true) as Direction;
      const book = interaction.options.getString('book', true) as Book;
      const reason = interaction.options.getString('reason', true);
      await addLedgerEntry(amount, direction, book, reason, 'manual', interaction.user.id);
      await interaction.editReply({ content: line('ok', `Recorded ${direction === 'inflow' ? '+' : '−'}${formatMoney(amount)} on the ${book} book: ${reason}`) });
      return;
    }
    const entries = await listEntries();
    await interaction.editReply({ embeds: [ledgerEmbed(computeBalances(entries), entries)] });
  },
};

export const ledgerCommands: Command[] = [ledger];
