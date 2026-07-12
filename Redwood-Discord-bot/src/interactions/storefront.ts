import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ChannelType,
  MessageFlags,
  ThreadAutoArchiveDuration,
} from 'discord.js';
import type { BotConfig } from '../lib/config';
import { line } from '../lib/voice';
import { addLedgerEntry } from '../db/ledger';
import {
  ORDER_BUTTON,
  DONATE_BUTTON,
  DONATE_MODAL,
  DONATE_AMOUNT,
  DONATE_NAME,
  PUBLIC_DONATION_THRESHOLD,
  donateModal,
  parseDonation,
  donationLogLine,
  donationPublicLine,
} from '../lib/storefront';
import { createOrder } from '../db/orders';
import { orderButtons, orderCardEmbed, ORDER_ACTION_PREFIX, ORDER_AMOUNT_MODAL_PREFIX } from '../lib/orders';
import { handleOrderAction, handleOrderAmountModal } from './orders';

/** Place an order → private thread + HC ping. Slow work, so defer first. */
export async function handleOrderButton(interaction: ButtonInteraction, cfg: BotConfig): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const channel = interaction.channel;
  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.editReply({ content: line('err', 'Orders can only be opened from a storefront text channel.') });
    return;
  }
  const thread = await channel.threads.create({
    name: `order-${interaction.user.username}`.slice(0, 100),
    type: ChannelType.PrivateThread,
    autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
    invitable: false,
  });
  await thread.members.add(interaction.user.id);
  await thread.send(
    `<@&${cfg.roleForRank['high-command']}> — new order from <@${interaction.user.id}>. ` +
      'State the job: what, where, when. Someone will be with you.',
  );
  const order = await createOrder(interaction.user.id, thread.id, '');
  const row = orderButtons(order.id, order.status);
  await thread.send({ embeds: [orderCardEmbed(order)], components: row ? [row] : [] });
  await interaction.editReply({ content: line('ok', `Your ticket is open: ${thread}. Tell us what you need there.`) });
}

/** Donate → show the modal. MUST be the first response (no defer). */
export async function handleDonateButton(interaction: ButtonInteraction): Promise<void> {
  await interaction.showModal(donateModal());
}

/** Donate modal submit → validate → ledger white inflow → optional log → optional public shout-out. */
export async function handleDonateModal(interaction: ModalSubmitInteraction, cfg: BotConfig): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const parsed = parseDonation(interaction.fields.getTextInputValue(DONATE_AMOUNT));
  if (!parsed.ok) {
    await interaction.editReply({ content: line('err', parsed.error) });
    return;
  }
  const name = interaction.fields.getTextInputValue(DONATE_NAME).trim() || null;
  const reason = name ? `Donation from ${name}` : 'Donation (anonymous)';
  await addLedgerEntry(parsed.amount, 'inflow', 'white', reason, 'donation', interaction.user.id);

  if (cfg.channelDonations) {
    const ch = await interaction.client.channels.fetch(cfg.channelDonations).catch(() => null);
    if (ch?.isTextBased() && 'send' in ch) {
      await ch.send(donationLogLine(parsed.amount, name)).catch(() => {});
    }
  }
  if (parsed.amount >= PUBLIC_DONATION_THRESHOLD) {
    const store = interaction.channel;
    if (store?.isTextBased() && 'send' in store) {
      await store.send(donationPublicLine(parsed.amount, name)).catch(() => {});
    }
  }
  await interaction.editReply({ content: line('ok', 'Recorded. The company remembers its friends.') });
}

/** Shared 50013-aware ephemeral error reply, handling deferred vs fresh interactions. */
async function replyError(interaction: ButtonInteraction | ModalSubmitInteraction, err: unknown): Promise<void> {
  console.error(err);
  const isPerms = (err as { code?: number })?.code === 50013;
  const text = isPerms
    ? "I couldn't do that here — I need Create Private Threads + Manage Threads (and Send Messages) in this channel."
    : 'Something went wrong. It has been noted.';
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ content: line('err', text) }).catch(() => {});
  } else {
    await interaction.reply({ content: line('err', text), flags: MessageFlags.Ephemeral }).catch(() => {});
  }
}

/** Prefix dispatch for storefront buttons. */
export async function routeButton(interaction: ButtonInteraction, cfg: BotConfig): Promise<void> {
  try {
    if (interaction.customId === ORDER_BUTTON) return await handleOrderButton(interaction, cfg);
    if (interaction.customId === DONATE_BUTTON) return await handleDonateButton(interaction);
    if (interaction.customId.startsWith(ORDER_ACTION_PREFIX)) return await handleOrderAction(interaction);
  } catch (err) {
    await replyError(interaction, err);
  }
}

/** Prefix dispatch for storefront modals. */
export async function routeModal(interaction: ModalSubmitInteraction, cfg: BotConfig): Promise<void> {
  try {
    if (interaction.customId === DONATE_MODAL) return await handleDonateModal(interaction, cfg);
    if (interaction.customId.startsWith(ORDER_AMOUNT_MODAL_PREFIX)) return await handleOrderAmountModal(interaction);
  } catch (err) {
    await replyError(interaction, err);
  }
}
