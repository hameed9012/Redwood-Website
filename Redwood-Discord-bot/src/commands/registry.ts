import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { Command } from './types';
import { line } from '../lib/voice';
import { getMember } from '../db/members';
import { getActiveIdentity } from '../db/identities';
import { generateSerial } from '../lib/serialGen';
import { registerFirearm, registerVehicle, vehicleExists, flagItem } from '../db/registry';
import { registrationEmbed } from '../lib/embeds';

async function ownerContext(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser('owner', true);
  const m = await getMember(user.id);
  if (!m || m.status !== 'active') { await interaction.editReply({ content: line('deny', 'That member is not on the roster.') }); return null; }
  const id = await getActiveIdentity(user.id);
  if (!id) { await interaction.editReply({ content: line('err', 'That member has no active identity. Run `/identity create` first.') }); return null; }
  return { m, id };
}

const serial: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('serial').setDescription('Mint and register a firearm serial.')
    .addStringOption((o) => o.setName('type').setDescription('Firearm type').setRequired(true))
    .addUserOption((o) => o.setName('owner').setDescription('Register to this member').setRequired(true)) as SlashCommandBuilder,
  async execute(interaction) {
    const ctx = await ownerContext(interaction);
    if (!ctx) return;
    const type = interaction.options.getString('type', true);
    const sn = generateSerial();
    await registerFirearm(sn, type, ctx.m.discordId, ctx.id.id);
    await interaction.editReply({ embeds: [registrationEmbed('firearm', sn, type, ctx.id.legalName)] });
  },
};

const vehicle: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('vehicle').setDescription('Register a vehicle and its plate.')
    .addStringOption((o) => o.setName('plate').setDescription('The plate (from ERLC)').setRequired(true))
    .addStringOption((o) => o.setName('description').setDescription('Make / model / colour').setRequired(true))
    .addUserOption((o) => o.setName('owner').setDescription('Register to this member').setRequired(true)) as SlashCommandBuilder,
  async execute(interaction) {
    const ctx = await ownerContext(interaction);
    if (!ctx) return;
    const plate = interaction.options.getString('plate', true);
    const description = interaction.options.getString('description', true);
    if (await vehicleExists(plate)) return void interaction.editReply({ content: line('deny', 'That plate is already registered.') });
    await registerVehicle(plate, description, ctx.m.discordId, ctx.id.id);
    await interaction.editReply({ embeds: [registrationEmbed('vehicle', plate, description, ctx.id.legalName)] });
  },
};

const flag: Command = {
  highCommandOnly: true,
  data: new SlashCommandBuilder().setName('flag').setDescription('Flag or clear a serial or plate.')
    .addStringOption((o) => o.setName('identifier').setDescription('A serial or plate').setRequired(true))
    .addStringOption((o) => o.setName('status').setDescription('flagged or clean').setRequired(true)
      .addChoices({ name: 'flagged', value: 'flagged' }, { name: 'clean', value: 'clean' }))
    .addStringOption((o) => o.setName('note').setDescription('Reason (optional)')) as SlashCommandBuilder,
  async execute(interaction) {
    const identifier = interaction.options.getString('identifier', true);
    const status = interaction.options.getString('status', true) as 'clean' | 'flagged';
    const note = interaction.options.getString('note') ?? null;
    const hit = await flagItem(identifier, status, note);
    if (!hit) return void interaction.editReply({ content: line('err', 'Nothing on file with that serial or plate.') });
    await interaction.editReply({ content: line('ok', `${hit === 'firearm' ? 'Serial' : 'Plate'} **${identifier}** is now ${status}.`) });
  },
};

export const registryCommands: Command[] = [serial, vehicle, flag];
