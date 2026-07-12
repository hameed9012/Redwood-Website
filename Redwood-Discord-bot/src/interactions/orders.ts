import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} from 'discord.js';
import { line } from '../lib/voice';
import { getOrder, updateOrderStatus, completeOrder } from '../db/orders';
import {
  assertTransition,
  orderButtons,
  orderCardEmbed,
  parseAmount,
  ACTION_TARGET,
  ORDER_ACTION_PREFIX,
  ORDER_AMOUNT_MODAL_PREFIX,
  ORDER_AMOUNT_FIELD,
  type Order,
  type OrderAction,
} from '../lib/orders';

/** Rebuild the pinned order card in place. The fulfil modal is shown from the
 *  card's button, so a ModalSubmit here also carries `.message`. */
async function refreshCard(interaction: ButtonInteraction | ModalSubmitInteraction, order: Order): Promise<void> {
  const row = orderButtons(order.id, order.status);
  await interaction.message?.edit({ embeds: [orderCardEmbed(order)], components: row ? [row] : [] }).catch(() => {});
}

function amountModal(orderId: string): ModalBuilder {
  const amount = new TextInputBuilder()
    .setCustomId(ORDER_AMOUNT_FIELD)
    .setLabel('Amount collected (whole dollars)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('25000');
  return new ModalBuilder()
    .setCustomId(`${ORDER_AMOUNT_MODAL_PREFIX}${orderId}`)
    .setTitle('Fulfil order')
    .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(amount));
}

/** Handle a `rw_order_<action>:<orderId>` button. */
export async function handleOrderAction(interaction: ButtonInteraction): Promise<void> {
  const [key, orderId] = interaction.customId.split(':');
  const action = key.slice(ORDER_ACTION_PREFIX.length) as OrderAction;

  // Fulfil collects an amount → must open the modal as the first response (no defer).
  if (action === 'fulfill') {
    await interaction.showModal(amountModal(orderId));
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const order = await getOrder(orderId);
  if (!order) {
    await interaction.editReply({ content: line('err', 'No order is attached to this thread.') });
    return;
  }
  const target = ACTION_TARGET[action];
  const check = assertTransition(order.status, target);
  if (!check.ok) {
    await interaction.editReply({ content: line('deny', check.error) });
    return;
  }

  if (action === 'claim') {
    const updated = await updateOrderStatus(orderId, 'claimed', { claimedBy: interaction.user.id });
    await refreshCard(interaction, updated);
    await interaction.editReply({ content: line('ok', `You claimed order #${updated.seq}.`) });
    return;
  }
  if (action === 'cancel') {
    const updated = await updateOrderStatus(orderId, 'cancelled');
    await refreshCard(interaction, updated);
    await interaction.editReply({ content: line('ok', `Order #${updated.seq} cancelled.`) });
    return;
  }
  // action === 'done'
  if (order.amount == null) {
    await interaction.editReply({ content: line('deny', 'Set the amount first with Fulfilled.') });
    return;
  }
  const updated = await completeOrder(order, interaction.user.id);
  await refreshCard(interaction, updated);
  await interaction.editReply({ content: line('ok', `Order #${updated.seq} done — posted to the ledger.`) });
}

/** Handle the `rw_order_amount:<orderId>` fulfil modal submit. */
export async function handleOrderAmountModal(interaction: ModalSubmitInteraction): Promise<void> {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const orderId = interaction.customId.slice(ORDER_AMOUNT_MODAL_PREFIX.length);
  const order = await getOrder(orderId);
  if (!order) {
    await interaction.editReply({ content: line('err', 'No order is attached to this thread.') });
    return;
  }
  const check = assertTransition(order.status, 'fulfilled');
  if (!check.ok) {
    await interaction.editReply({ content: line('deny', check.error) });
    return;
  }
  const parsed = parseAmount(interaction.fields.getTextInputValue(ORDER_AMOUNT_FIELD));
  if (!parsed.ok) {
    await interaction.editReply({ content: line('err', parsed.error) });
    return;
  }
  const updated = await updateOrderStatus(orderId, 'fulfilled', { amount: parsed.amount });
  await refreshCard(interaction, updated);
  await interaction.editReply({ content: line('ok', `Order #${updated.seq} marked fulfilled at the set amount.`) });
}
