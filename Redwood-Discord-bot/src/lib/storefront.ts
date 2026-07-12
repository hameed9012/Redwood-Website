import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { baseEmbed } from './embeds';
import { formatMoney } from './ledger';

export const ORDER_BUTTON = 'rw_order';
export const DONATE_BUTTON = 'rw_donate';
export const DONATE_MODAL = 'rw_donate_modal';
export const DONATE_AMOUNT = 'amount';
export const DONATE_NAME = 'name';
export const PUBLIC_DONATION_THRESHOLD = 50000;

/** Strip $, commas, and whitespace; accept whole positive dollars only. */
export function parseDonation(amountStr: string): { ok: true; amount: number } | { ok: false; error: string } {
  const cleaned = amountStr.replace(/[$,\s]/g, '');
  if (!/^\d+$/.test(cleaned)) return { ok: false, error: 'That is not a whole-dollar amount. Round numbers only.' };
  const amount = Number(cleaned);
  if (amount <= 0) return { ok: false, error: 'A donation has to be more than nothing.' };
  return { ok: true, amount };
}

export function storefrontEmbed(): EmbedBuilder {
  return baseEmbed('info', 'Storefront')
    .setTitle('Redwood Peak — Open for Work')
    .setDescription(
      'We are a skilled and well known multi-million dollar pharmaceutical company, originally founded ' +
        'on October 5, 2024, and have since expanded into multiple fields, including an official store ' +
        'located on Valley Drive. We also operate a charity and other shell companies that have their ' +
        'hands in other industries. Our core belief is that we should be present in every medical supply ' +
        'chain, supporting pharmacies and partner companies so our products reach the people who need ' +
        'them. We also believe in returning back to the community, and if you wish to support us in that, ' +
        'kindly proceed with the **donate** button below — or apply in order to join our ranks and ' +
        'continue making america greater.\n\n' +
        'Our orders for medical supplies and more are also open. Do note we only deal in **bulk**.',
    );
}

export function storefrontButtons(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(ORDER_BUTTON).setStyle(ButtonStyle.Primary).setLabel('Place an order'),
    new ButtonBuilder().setCustomId(DONATE_BUTTON).setStyle(ButtonStyle.Secondary).setLabel('Donate'),
  );
}

export function donateModal(): ModalBuilder {
  const amount = new TextInputBuilder()
    .setCustomId(DONATE_AMOUNT)
    .setLabel('Amount (whole dollars)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder('50000');
  const name = new TextInputBuilder()
    .setCustomId(DONATE_NAME)
    .setLabel('Name to credit (blank = anonymous)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setMaxLength(80);
  return new ModalBuilder()
    .setCustomId(DONATE_MODAL)
    .setTitle('Donate to Redwood Peak')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(amount),
      new ActionRowBuilder<TextInputBuilder>().addComponents(name),
    );
}

export function donationLogLine(amount: number, name: string | null): string {
  const who = name ?? 'anonymous';
  return `💰 Donation recorded: ${formatMoney(amount)} — ${who} (white book).`;
}

export function donationPublicLine(amount: number, name: string | null): string {
  const who = name ?? 'an anonymous benefactor';
  return `Redwood Peak thanks ${who} for a generous contribution of ${formatMoney(amount)}.`;
}
