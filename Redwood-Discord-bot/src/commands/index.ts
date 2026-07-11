import type { Command } from './types';
import { help } from './help';
import { rosterCommands } from './roster';
import { rosterAdminCommands } from './rosterAdmin';
import { securityCommands } from './security';
import { speechCommands } from './say';
import { identityCommands } from './identity';
import { shiftCommands } from './shift';
import { lookupCommands } from './lookup';
import { registryCommands } from './registry';
import { reputationCommands } from './reputation';
import { carouselCommands } from './carousel';
import { ledgerCommands } from './ledger';

export const commands: Command[] = [help, ...rosterCommands, ...rosterAdminCommands, ...securityCommands, ...speechCommands, ...identityCommands, ...shiftCommands, ...lookupCommands, ...registryCommands, ...reputationCommands, ...carouselCommands, ...ledgerCommands];

export const commandMap = new Map(commands.map((c) => [c.data.name, c]));
