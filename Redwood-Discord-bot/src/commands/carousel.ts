import { SlashCommandBuilder } from 'discord.js';
import type { Command } from './types';
import { line } from '../lib/voice';
import { uploadCarouselImage, addSlide, removeSlideByTitle, listSlides } from '../db/carousel';
import { carouselListEmbed } from '../lib/embeds';

const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };

const carousel: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('carousel').setDescription('Manage the website media carousel.')
    .addSubcommand((s) => s.setName('add').setDescription('Add a slide.')
      .addStringOption((o) => o.setName('title').setDescription('Slide title').setRequired(true))
      .addStringOption((o) => o.setName('body').setDescription('Slide text').setRequired(true))
      .addAttachmentOption((o) => o.setName('image').setDescription('Slide image').setRequired(true)))
    .addSubcommand((s) => s.setName('remove').setDescription('Remove a slide by title.')
      .addStringOption((o) => o.setName('title').setDescription('Exact slide title').setRequired(true)))
    .addSubcommand((s) => s.setName('list').setDescription('List the current slides.')) as SlashCommandBuilder,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      await interaction.editReply({ embeds: [carouselListEmbed(await listSlides())] });
      return;
    }

    if (sub === 'remove') {
      const title = interaction.options.getString('title', true);
      const n = await removeSlideByTitle(title);
      await interaction.editReply({ content: n ? line('ok', `Removed **${title}**.`) : line('err', 'No slide with that title.') });
      return;
    }

    // add
    const title = interaction.options.getString('title', true);
    const body = interaction.options.getString('body', true);
    const image = interaction.options.getAttachment('image', true);
    const ct = image.contentType ?? '';
    if (!ct.startsWith('image/')) return void interaction.editReply({ content: line('err', 'That attachment is not an image.') });
    const ext = EXT[ct] ?? 'png';
    const res = await fetch(image.url);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const url = await uploadCarouselImage(bytes, ct, ext);
    await addSlide(title, body, url);
    await interaction.editReply({ content: line('ok', `Added slide **${title}**. It is live on the site.`) });
  },
};

export const carouselCommands: Command[] = [carousel];
