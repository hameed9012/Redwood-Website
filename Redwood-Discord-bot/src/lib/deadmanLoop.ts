import type { Client, TextChannel } from 'discord.js';
import { config } from './config';
import { getSecurityConfig } from '../db/config';
import { isDeadmanLapsed } from '../security/heuristics';
import { line } from './voice';

/** Every 15 min, if the dead-man deadline has lapsed, fire a one-time purge ALERT (non-destructive). */
export function startDeadmanLoop(client: Client): void {
  let alerted = false;
  setInterval(async () => {
    const cfg = config();
    const guild = client.guilds.cache.get(cfg.guildId);
    if (!guild) return;
    const sec = await getSecurityConfig(guild.id).catch(() => null);
    if (!sec) return;
    const deadlineMs = sec.deadmanDeadline ? Date.parse(sec.deadmanDeadline) : null;
    if (isDeadmanLapsed(deadlineMs, Date.now())) {
      if (!alerted) {
        alerted = true;
        const hc = await guild.channels.fetch(cfg.channelHighCommand).catch(() => null);
        if (hc && hc.isTextBased()) {
          (hc as TextChannel).send(line('err', "The dead-man's switch has lapsed. No one reset it. Reconsider.")).catch(() => {});
        }
      }
    } else {
      alerted = false;
    }
  }, 15 * 60_000);
}
