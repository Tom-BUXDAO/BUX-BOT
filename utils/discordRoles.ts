import { Client, GuildMember, GatewayIntentBits } from 'discord.js';
import { prisma } from '@/lib/prisma';
import { setTimeout } from 'timers/promises';

interface RoleUpdate {
  added: string[];
  removed: string[];
}

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const RATE_LIMIT_DELAY = 1000; // 1 second between role operations

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
      rest: {
        timeout: 60000, // 60 second timeout
        retries: 3
      }
    });

    await client.login(DISCORD_BOT_TOKEN);
  }

  if (!client.isReady()) {
    await new Promise<void>((resolve, reject) => {
      const timeoutId = global.setTimeout(() => {
        client = null;
        resolve();
      }, 30000); // 30 second connection timeout

      client!.once('ready', () => {
        global.clearTimeout(timeoutId);
        resolve();
      });
    });
  }

  return client;
}

export async function updateDiscordRoles(discordId: string, newRoles: string[]): Promise<RoleUpdate> {
  try {
    // Get current roles from database
    const user = await prisma.user.findUnique({
      where: { discordId }
    });

    const currentRoles = user?.roles || [];
    
    // Determine roles to add and remove
    const rolesToAdd = newRoles.filter(role => !currentRoles.includes(role));
    const rolesToRemove = currentRoles.filter(role => !newRoles.includes(role));

    // Update Discord server roles
    const client = await getClient();
    const guild = await client.guilds.fetch(GUILD_ID!);
    const member = await guild.members.fetch(discordId);

    if (!member) {
      throw new Error('Member not found in Discord server');
    }

    // Remove old roles with rate limiting
    for (const roleId of rolesToRemove) {
      const role = guild.roles.cache.get(roleId);
      if (role) {
        try {
          await member.roles.remove(role);
          console.log(`Removed role ${role.name} from ${member.user.tag}`);
          await setTimeout(RATE_LIMIT_DELAY); // Wait between operations
        } catch (error) {
          console.error(`Failed to remove role ${role.name}:`, error);
        }
      }
    }

    // Add new roles with rate limiting
    for (const roleId of rolesToAdd) {
      const role = guild.roles.cache.get(roleId);
      if (role) {
        try {
          await member.roles.add(role);
          console.log(`Added role ${role.name} to ${member.user.tag}`);
          await setTimeout(RATE_LIMIT_DELAY); // Wait between operations
        } catch (error) {
          console.error(`Failed to add role ${role.name}:`, error);
        }
      }
    }

    // Update user roles in database
    await prisma.user.update({
      where: { discordId },
      data: { roles: newRoles }
    });

    return {
      added: rolesToAdd,
      removed: rolesToRemove
    };

  } catch (error) {
    console.error('Error updating Discord roles:', error);
    throw error;
  }
} 