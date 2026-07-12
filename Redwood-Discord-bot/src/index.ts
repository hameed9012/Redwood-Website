import 'dotenv/config';
import { Client, GatewayIntentBits, Partials, REST, Routes, Events, MessageFlags } from 'discord.js';
import { config } from './lib/config';
import { commands, commandMap } from './commands/index';
import { hasHighCommandRole } from './lib/permissions';
import { line } from './lib/voice';
import { startDeadmanLoop } from './lib/deadmanLoop';
import { redrawRoster } from './roster/render';
import * as memberAdd from './events/guildMemberAdd';
import * as messageCreate from './events/messageCreate';
import * as auditLog from './events/guildAuditLogEntryCreate';
import { loggingHandlers } from './events/logging';
import { routeButton, routeModal } from './interactions/storefront';

const cfg = config(); // validates env; throws with a clear message if misconfigured

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
  // Needed so delete/edit events fire for messages not in the cache.
  partials: [Partials.Message, Partials.Channel],
});

async function registerCommands(): Promise<void> {
  const rest = new REST().setToken(cfg.discordToken);
  await rest.put(Routes.applicationGuildCommands(cfg.discordClientId, cfg.guildId), {
    body: commands.map((c) => c.data.toJSON()),
  });
}

client.once(Events.ClientReady, async (c) => {
  console.log(`Redwood Peak bot online as ${c.user.tag}`);
  const guild = c.guilds.cache.get(cfg.guildId);
  if (guild) await redrawRoster(guild).catch(() => {});
  startDeadmanLoop(c);
});

client.on(memberAdd.name, memberAdd.execute);
client.on(messageCreate.name, messageCreate.execute);
client.on(auditLog.name, auditLog.execute);
for (const h of loggingHandlers) client.on(h.name, h.execute as (...args: unknown[]) => void);

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) return routeButton(interaction, cfg);
  if (interaction.isModalSubmit()) return routeModal(interaction, cfg);
  if (!interaction.isChatInputCommand() || !interaction.guild) return;
  const command = commandMap.get(interaction.commandName);
  if (!command) return;
  if (command.highCommandOnly) {
    const roleIds = [...(interaction.member?.roles as any)?.cache?.keys?.() ?? []];
    if (!hasHighCommandRole(roleIds, cfg.roleForRank['high-command'])) {
      await interaction.reply({ content: line('deny', 'That action is above your clearance.'), flags: MessageFlags.Ephemeral });
      return;
    }
  }
  try {
    // Acknowledge within Discord's 3s window; commands then use editReply.
    // Slow work (roster redraws, lockdown editing every channel, Supabase round
    // trips) otherwise expires the interaction token → 10062 Unknown interaction.
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    // 50013 = Missing Permissions — almost always role hierarchy or a missing
    // Manage Roles/Nicknames permission (or trying to modify the server owner).
    const isPerms = (err as { code?: number })?.code === 50013;
    const text = isPerms
      ? "I couldn't apply that — my role must sit ABOVE the rank/division/position roles, I need Manage Roles + Manage Nicknames, and I can't modify the server owner."
      : 'Something went wrong. It has been noted.';
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: line('err', text) }).catch(() => {});
    } else {
      await interaction.reply({ content: line('err', text), flags: MessageFlags.Ephemeral }).catch(() => {});
    }
  }
});

registerCommands()
  .then(() => client.login(cfg.discordToken))
  .catch((e) => { console.error('Startup failed:', e); process.exit(1); });
