import { SlashCommandBuilder } from 'discord.js';
import type { Command } from './types';
import { classifyQuery, buildLookupResult } from '../lib/lookup';
import { gatherLookup } from '../db/lookup';
import { lookupEmbed } from '../lib/embeds';
import { hasHighCommandRole } from '../lib/permissions';
import { config } from '../lib/config';

const lookup: Command = {
  highCommandOnly: false,
  data: new SlashCommandBuilder().setName('lookup').setDescription('Search the company records.')
    .addStringOption((o) => o.setName('query').setDescription('A name, cover, plate, badge, or @member').setRequired(true)) as SlashCommandBuilder,
  async execute(interaction) {
    const cfg = config();
    const raw = interaction.options.getString('query', true);
    const roleIds = [...(interaction.member?.roles as { cache?: { keys?: () => Iterable<string> } })?.cache?.keys?.() ?? []];
    const viewerIsHC = hasHighCommandRole(roleIds, cfg.roleForRank['high-command']);

    const query = classifyQuery(raw);
    const data = await gatherLookup(query);
    const result = buildLookupResult(query, data, viewerIsHC);
    await interaction.editReply({ embeds: [lookupEmbed(result)] });
  },
};

export const lookupCommands: Command[] = [lookup];
