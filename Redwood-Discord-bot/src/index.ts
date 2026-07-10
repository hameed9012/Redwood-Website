import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, Events, MessageFlags } from 'discord.js';
import { config } from './lib/config';
import { commands, commandMap } from './commands/index';
import { hasHighCommandRole } from './lib/permissions';
import { line } from './lib/voice';
import { startDeadmanLoop } from './lib/deadmanLoop';
import { redrawRoster } from './roster/render';
import * as memberAdd from './events/guildMemberAdd';
import * as messageCreate from './events/messageCreate';
import * as auditLog from './events/guildAuditLogEntryCreate';

const cfg = config(); // validates env; throws with a clear message if misconfigured

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
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

client.on(Events.InteractionCreate, async (interaction) => {
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
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    const msg = { content: line('err', 'Something went wrong. It has been noted.'), flags: MessageFlags.Ephemeral } as const;
    if (interaction.replied || interaction.deferred) await interaction.followUp(msg).catch(() => {});
    else await interaction.reply(msg).catch(() => {});
  }
});

registerCommands()
  .then(() => client.login(cfg.discordToken))
  .catch((e) => { console.error('Startup failed:', e); process.exit(1); });
