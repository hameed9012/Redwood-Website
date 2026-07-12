import { SlashCommandBuilder } from 'discord.js';
import type { Command } from './types';
import { line } from '../lib/voice';
import { getMember } from '../db/members';
import { getOrderByThread, updateOrderStatus, completeOrder } from '../db/orders';
import { assertTransition, orderCardEmbed } from '../lib/orders';

const orderCommand: Command = {
  highCommandOnly: false,
  data: new SlashCommandBuilder()
    .setName('order')
    .setDescription('Work a tracked order from inside its ticket thread.')
    .addSubcommand((s) => s.setName('claim').setDescription('Take ownership of this order.'))
    .addSubcommand((s) =>
      s
        .setName('fulfill')
        .setDescription('Mark the work done and set the amount collected.')
        .addIntegerOption((o) => o.setName('amount').setDescription('Whole dollars').setRequired(true).setMinValue(1)),
    )
    .addSubcommand((s) => s.setName('done').setDescription('Close the order and post its earnings to the ledger.'))
    .addSubcommand((s) => s.setName('cancel').setDescription('Cancel this order (claimer or High Command).'))
    .addSubcommand((s) => s.setName('status').setDescription('Show this order’s current card.')) as SlashCommandBuilder,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const order = await getOrderByThread(interaction.channelId);
    if (!order) {
      await interaction.editReply({ content: line('err', 'No order is attached to this thread.') });
      return;
    }

    if (sub === 'status') {
      await interaction.editReply({ embeds: [orderCardEmbed(order)] });
      return;
    }

    const me = await getMember(interaction.user.id);
    if (!me || me.status !== 'active') {
      await interaction.editReply({ content: line('deny', 'You are not on the roster.') });
      return;
    }

    if (sub === 'claim') {
      const check = assertTransition(order.status, 'claimed');
      if (!check.ok) return void interaction.editReply({ content: line('deny', check.error) });
      const updated = await updateOrderStatus(order.id, 'claimed', { claimedBy: interaction.user.id });
      await interaction.editReply({ embeds: [orderCardEmbed(updated)] });
      return;
    }

    if (sub === 'fulfill') {
      const check = assertTransition(order.status, 'fulfilled');
      if (!check.ok) return void interaction.editReply({ content: line('deny', check.error) });
      const amount = interaction.options.getInteger('amount', true);
      const updated = await updateOrderStatus(order.id, 'fulfilled', { amount });
      await interaction.editReply({ embeds: [orderCardEmbed(updated)] });
      return;
    }

    if (sub === 'done') {
      const check = assertTransition(order.status, 'done');
      if (!check.ok) return void interaction.editReply({ content: line('deny', check.error) });
      if (order.amount == null) return void interaction.editReply({ content: line('deny', 'Set the amount first with `/order fulfill`.') });
      const updated = await completeOrder(order, interaction.user.id);
      await interaction.editReply({ embeds: [orderCardEmbed(updated)] });
      return;
    }

    // sub === 'cancel'
    const isClaimer = order.claimedBy === interaction.user.id;
    if (!isClaimer && me.rank !== 'high-command') {
      await interaction.editReply({ content: line('deny', 'Only the claimer or High Command can cancel this order.') });
      return;
    }
    const check = assertTransition(order.status, 'cancelled');
    if (!check.ok) return void interaction.editReply({ content: line('deny', check.error) });
    const updated = await updateOrderStatus(order.id, 'cancelled');
    await interaction.editReply({ embeds: [orderCardEmbed(updated)] });
  },
};

export const orderCommands: Command[] = [orderCommand];
