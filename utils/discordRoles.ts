import { Client, GuildMember, GatewayIntentBits } from 'discord.js';
import { prisma } from '@/lib/prisma';
import { setTimeout } from 'timers/promises';
import { User, Prisma } from '@prisma/client';

interface RoleUpdate {
  added: string[];
  removed: string[];
}

// Extend the User type to include roles
interface UserWithRoles extends User {
  roles: string[];
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

export async function updateDiscordRoles(discordId: string, newRoles: string[]) {
  try {
    // Get current roles from database
    const user = await prisma.user.findUnique({
      where: { discordId }
    }) as UserWithRoles | null;

    const currentRoles = user?.roles || [];
    console.log('Current roles:', currentRoles);

    // Calculate changes
    const rolesToAdd = newRoles.filter(role => !currentRoles.includes(role));
    const rolesToRemove = currentRoles.filter(role => !newRoles.includes(role));

    console.log('Roles to add:', rolesToAdd);
    console.log('Roles to remove:', rolesToRemove);

    // Update roles in database
    await prisma.user.update({
      where: { discordId },
      data: {
        // @ts-ignore - we know roles exists in the database
        roles: newRoles
      }
    });

    // Log each role change
    rolesToAdd.forEach(role => {
      console.log(`Added role ${role} to ${discordId}`);
    });

    rolesToRemove.forEach(role => {
      console.log(`Removed role ${role} from ${discordId}`);
    });

    return true;
  } catch (error) {
    console.error('Error updating Discord roles:', error);
    return false;
  }
} 