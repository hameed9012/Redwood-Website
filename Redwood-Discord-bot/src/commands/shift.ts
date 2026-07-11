import { SlashCommandBuilder, MessageFlags, type ChatInputCommandInteraction } from 'discord.js';
import type { Command } from './types';
import { line } from '../lib/voice';
import { getMember } from '../db/members';
import { getActiveIdentity } from '../db/identities';
import { getOpenShift, startShift, closeShift } from '../db/shifts';
import { addIncident, addParty, latestIncidentForShift, countIncidents } from '../db/incidents';
import { addReport } from '../db/reports';
import { shiftDurationMinutes, formatDuration, validateParty, type PartyInput } from '../lib/shiftMath';

const EPH = { flags: MessageFlags.Ephemeral } as const;
const ROLES = ['civilian', 'officer', 'witness', 'other'] as const;

const shift: Command = {
  highCommandOnly: false,
  data: new SlashCommandBuilder().setName('shift').setDescription('On-duty records.')
    .addSubcommand((s) => s.setName('start').setDescription('Go on duty.'))
    .addSubcommand((s) => s.setName('log').setDescription('Record an incident this shift.')
      .addStringOption((o) => o.setName('summary').setDescription('What happened').setRequired(true))
      .addStringOption((o) => o.setName('location').setDescription('Where').setRequired(true))
      .addStringOption((o) => o.setName('name').setDescription('Primary party name'))
      .addStringOption((o) => o.setName('cover_name').setDescription('Primary party cover name'))
      .addStringOption((o) => o.setName('plate').setDescription('Vehicle plate'))
      .addStringOption((o) => o.setName('badge').setDescription('Officer badge'))
      .addStringOption((o) => o.setName('role').setDescription('Primary party role')
        .addChoices(...ROLES.map((r) => ({ name: r, value: r })))))
    .addSubcommand((s) => s.setName('party').setDescription('Add another party to your latest incident.')
      .addStringOption((o) => o.setName('role').setDescription('Their role').setRequired(true)
        .addChoices(...ROLES.map((r) => ({ name: r, value: r }))))
      .addStringOption((o) => o.setName('name').setDescription('Name'))
      .addStringOption((o) => o.setName('cover_name').setDescription('Cover name'))
      .addStringOption((o) => o.setName('plate').setDescription('Plate'))
      .addStringOption((o) => o.setName('badge').setDescription('Badge'))
      .addStringOption((o) => o.setName('unit').setDescription('Unit')))
    .addSubcommand((s) => s.setName('end').setDescription('Close out your shift.')
      .addStringOption((o) => o.setName('movements').setDescription('Landmarks / route you passed').setRequired(true)))
    .addSubcommand((s) => s.setName('report').setDescription('File a witness dossier for this shift.')
      .addStringOption((o) => o.setName('subject').setDescription('Who / what').setRequired(true))
      .addStringOption((o) => o.setName('body').setDescription('The account').setRequired(true)))
    .addSubcommand((s) => s.setName('status').setDescription('Your current duty status.')) as SlashCommandBuilder,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'start') return start(interaction);
    if (sub === 'log') return logIncident(interaction);
    if (sub === 'party') return party(interaction);
    if (sub === 'end') return end(interaction);
    if (sub === 'report') return report(interaction);
    return status(interaction);
  },
};

async function requireRoster(interaction: ChatInputCommandInteraction) {
  const m = await getMember(interaction.user.id);
  if (!m || m.status !== 'active') {
    await interaction.reply({ content: line('deny', 'You are not on the active roster.'), ...EPH });
    return null;
  }
  return m;
}

async function start(interaction: ChatInputCommandInteraction) {
  const m = await requireRoster(interaction);
  if (!m) return;
  if (await getOpenShift(m.discordId)) {
    return void interaction.reply({ content: line('deny', 'You already have an open shift. `/shift end` first.'), ...EPH });
  }
  const id = await getActiveIdentity(m.discordId);
  await startShift(m.discordId, id?.id ?? null);
  await interaction.reply({ content: line('ok', 'On duty. Your movements are being recorded.'), ...EPH });
}

function readParty(interaction: ChatInputCommandInteraction): PartyInput {
  return {
    role: (interaction.options.getString('role') as PartyInput['role']) ?? 'civilian',
    name: interaction.options.getString('name'),
    coverName: interaction.options.getString('cover_name'),
    plate: interaction.options.getString('plate'),
    badge: interaction.options.getString('badge'),
    unit: interaction.options.getString('unit'),
  };
}

async function logIncident(interaction: ChatInputCommandInteraction) {
  const m = await requireRoster(interaction);
  if (!m) return;
  const shiftRow = await getOpenShift(m.discordId);
  if (!shiftRow) return void interaction.reply({ content: line('deny', 'You are off duty. `/shift start` first.'), ...EPH });
  const summary = interaction.options.getString('summary', true);
  const location = interaction.options.getString('location', true);
  const incident = await addIncident(shiftRow.id, m.discordId, summary, location);
  const p = readParty(interaction);
  const hasParty = [p.name, p.coverName, p.plate, p.badge].some((v) => v);
  if (hasParty) await addParty(incident.id, p);
  await interaction.reply({ content: line('ok', 'Logged. It is written down.'), ...EPH });
}

async function party(interaction: ChatInputCommandInteraction) {
  const m = await requireRoster(interaction);
  if (!m) return;
  const shiftRow = await getOpenShift(m.discordId);
  if (!shiftRow) return void interaction.reply({ content: line('deny', 'You are off duty. `/shift start` first.'), ...EPH });
  const incident = await latestIncidentForShift(shiftRow.id);
  if (!incident) return void interaction.reply({ content: line('deny', 'No incident yet this shift. `/shift log` first.'), ...EPH });
  const p = readParty(interaction);
  const err = validateParty(p);
  if (err) return void interaction.reply({ content: line('err', err), ...EPH });
  await addParty(incident.id, p);
  await interaction.reply({ content: line('ok', 'Added to the record.'), ...EPH });
}

async function end(interaction: ChatInputCommandInteraction) {
  const m = await requireRoster(interaction);
  if (!m) return;
  const shiftRow = await getOpenShift(m.discordId);
  if (!shiftRow) return void interaction.reply({ content: line('deny', 'You are already off duty.'), ...EPH });
  const movements = interaction.options.getString('movements', true);
  await closeShift(shiftRow.id, movements);
  const mins = shiftDurationMinutes(shiftRow.startedAt, new Date().toISOString());
  const n = await countIncidents(shiftRow.id);
  await interaction.reply({
    content: line('ok', `Shift closed — ${formatDuration(mins)}, ${n} incident(s) filed. Your movements have been recorded.`),
    ...EPH,
  });
}

async function report(interaction: ChatInputCommandInteraction) {
  const m = await requireRoster(interaction);
  if (!m) return;
  // Attach to the open shift if any, else the most recent — we just need a shift id.
  const openShift = await getOpenShift(m.discordId);
  if (!openShift) return void interaction.reply({ content: line('deny', 'File reports during an open shift. `/shift start` first.'), ...EPH });
  const subject = interaction.options.getString('subject', true);
  const body = interaction.options.getString('body', true);
  await addReport(openShift.id, m.discordId, subject, body);
  await interaction.reply({ content: line('ok', 'Dossier filed. It joins the record.'), ...EPH });
}

async function status(interaction: ChatInputCommandInteraction) {
  const m = await requireRoster(interaction);
  if (!m) return;
  const shiftRow = await getOpenShift(m.discordId);
  if (!shiftRow) return void interaction.reply({ content: line('ok', 'You are off duty.'), ...EPH });
  const mins = shiftDurationMinutes(shiftRow.startedAt, new Date().toISOString());
  const n = await countIncidents(shiftRow.id);
  await interaction.reply({ content: line('ok', `On duty — ${formatDuration(mins)} elapsed, ${n} incident(s) logged.`), ...EPH });
}

export const shiftCommands: Command[] = [shift];
