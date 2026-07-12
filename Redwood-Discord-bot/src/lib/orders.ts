import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { baseEmbed, type Tone } from './embeds';
import { formatMoney } from './ledger';

export type OrderStatus = 'open' | 'claimed' | 'fulfilled' | 'done' | 'cancelled';

export interface Order {
  id: string;
  seq: number;
  customerId: string;
  threadId: string;
  status: OrderStatus;
  claimedBy: string | null;
  amount: number | null;
  summary: string;
  createdAt: string;
}

export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  open: ['claimed', 'cancelled'],
  claimed: ['fulfilled', 'cancelled'],
  fulfilled: ['done', 'cancelled'],
  done: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: OrderStatus, to: OrderStatus): { ok: true } | { ok: false; error: string } {
  if (canTransition(from, to)) return { ok: true };
  if (from === to) return { ok: false, error: `This order is already ${from}.` };
  if (from === 'done' || from === 'cancelled') return { ok: false, error: `This order is ${from} and can't change.` };
  return { ok: false, error: `An order can't go from ${from} to ${to}.` };
}

export type OrderAction = 'claim' | 'fulfill' | 'done' | 'cancel';

/** Button custom id shape: `rw_order_<action>:<orderId>`. Distinct from the
 *  storefront `rw_order` button (exact match, no trailing underscore). */
export const ORDER_ACTION_PREFIX = 'rw_order_';
/** Fulfil-amount modal custom id shape: `rw_order_amount:<orderId>`. */
export const ORDER_AMOUNT_MODAL_PREFIX = 'rw_order_amount:';
export const ORDER_AMOUNT_FIELD = 'amount';

export const ACTION_TARGET: Record<OrderAction, OrderStatus> = {
  claim: 'claimed',
  fulfill: 'fulfilled',
  done: 'done',
  cancel: 'cancelled',
};

function actionButton(action: OrderAction, orderId: string, label: string, style: ButtonStyle): ButtonBuilder {
  return new ButtonBuilder().setCustomId(`${ORDER_ACTION_PREFIX}${action}:${orderId}`).setLabel(label).setStyle(style);
}

/** The action row valid for the current stage, or null when the order is terminal. */
export function orderButtons(orderId: string, status: OrderStatus): ActionRowBuilder<ButtonBuilder> | null {
  const btns: ButtonBuilder[] = [];
  if (status === 'open') btns.push(actionButton('claim', orderId, 'Claim', ButtonStyle.Primary));
  if (status === 'claimed') btns.push(actionButton('fulfill', orderId, 'Fulfilled', ButtonStyle.Primary));
  if (status === 'fulfilled') btns.push(actionButton('done', orderId, 'Done', ButtonStyle.Success));
  if (status === 'open' || status === 'claimed' || status === 'fulfilled') {
    btns.push(actionButton('cancel', orderId, 'Cancel', ButtonStyle.Danger));
  }
  if (btns.length === 0) return null;
  return new ActionRowBuilder<ButtonBuilder>().addComponents(...btns);
}

/** Statuses that require a positive amount to be set on the order. */
export function requiresAmount(to: OrderStatus): boolean {
  return to === 'fulfilled' || to === 'done';
}

/** Strip $, commas, whitespace; accept whole positive dollars only. */
export function parseAmount(amountStr: string): { ok: true; amount: number } | { ok: false; error: string } {
  const cleaned = amountStr.replace(/[$,\s]/g, '');
  if (!/^\d+$/.test(cleaned)) return { ok: false, error: 'That is not a whole-dollar amount. Round numbers only.' };
  const amount = Number(cleaned);
  if (amount <= 0) return { ok: false, error: 'The amount has to be more than nothing.' };
  return { ok: true, amount };
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  open: 'Open', claimed: 'Claimed', fulfilled: 'Fulfilled', done: 'Done', cancelled: 'Cancelled',
};

/** The order status card. Info while active, success on done, denied on cancelled. */
export function orderCardEmbed(order: Order): EmbedBuilder {
  const tone: Tone = order.status === 'done' ? 'success' : order.status === 'cancelled' ? 'denied' : 'info';
  const e = baseEmbed(tone, 'Orders')
    .setTitle(`Order #${order.seq}`)
    .addFields(
      { name: 'Status', value: STATUS_LABEL[order.status], inline: true },
      { name: 'Customer', value: `<@${order.customerId}>`, inline: true },
      { name: 'Claimed by', value: order.claimedBy ? `<@${order.claimedBy}>` : '—', inline: true },
      { name: 'Amount', value: order.amount != null ? formatMoney(order.amount) : '—', inline: true },
    );
  if (order.summary) e.setDescription(order.summary);
  return e;
}
