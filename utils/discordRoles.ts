import { Client, GuildMember, GatewayIntentBits } from 'discord.js';
import { NFT_THRESHOLDS, BUX_THRESHOLDS, MAIN_COLLECTIONS, BUXDAO_5_ROLE_ID, CollectionName } from './roleConfig';
import { prisma } from '@/lib/prisma';

interface CollectionCount {
  name: CollectionName;
  count: number;
}

interface RoleUpdate {
  added: string[];
  removed: string[];
}

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

// Create a singleton client with proper intents
let client: Client | null = null;

async function getClient(): Promise<Client> {
  if (!client) {
    client = new Client({ 
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages
      ],
      allowedMentions: { parse: ['users', 'roles'] },
      rest: {
        timeout: 8000,
        retries: 2
      }
    });

    client.on('error', (error) => {
      console.error('Discord client error:', error);
      client = null;
    });

    client.on('disconnect', () => {
      console.log('Discord client disconnected');
      client = null;
    });

    await client.login(DISCORD_BOT_TOKEN);
  }

  if (!client.isReady()) {
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        client = null;
        resolve();
      }, 5000);

      client!.once('ready', () => {
        clearTimeout(timeout);
        console.log('Discord client ready');
        resolve();
      });
    });
  }

  return client;
}

export async function updateDiscordRoles(discordId: string, newRoles: string[]): Promise<RoleUpdate> {
  // Get current roles from user
  const user = await prisma.user.findUnique({
    where: { discordId }
  });

  const currentRoles = user?.roles || [];
  
  // Determine roles to add and remove
  const rolesToAdd = newRoles.filter(role => !currentRoles.includes(role));
  const rolesToRemove = currentRoles.filter(role => !newRoles.includes(role));

  // Update user roles in database
  await prisma.user.update({
    where: { discordId },
    data: { roles: newRoles }
  });

  return {
    added: rolesToAdd,
    removed: rolesToRemove
  };
}

function getAllManagedRoleIds(): string[] {
  const roleIds = new Set<string>();

  Object.values(NFT_THRESHOLDS).forEach(config => {
    if (config.holder) roleIds.add(config.holder);
    if ('whale' in config && config.whale?.roleId) {
      roleIds.add(config.whale.roleId);
    }
  });

  BUX_THRESHOLDS.forEach(threshold => {
    if (threshold.roleId) roleIds.add(threshold.roleId);
  });

  if (BUXDAO_5_ROLE_ID) roleIds.add(BUXDAO_5_ROLE_ID);

  return Array.from(roleIds).filter((id): id is string => id !== undefined);
} 