import { Client, GuildMember, GatewayIntentBits, Role } from 'discord.js';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const RATE_LIMIT_DELAY = 1000;

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
        timeout: 60000,
        retries: 3
      }
    });

    await client.login(DISCORD_BOT_TOKEN);
  }

  if (!client.isReady()) {
    await new Promise<void>((resolve) => {
      client!.once('ready', () => resolve());
    });
  }

  return client;
}

const DISCORD_API = 'https://discord.com/api/v10';

interface DiscordRole {
  id: string;
  name: string;
}

async function getGuildRoles(): Promise<Record<string, string>> {
  const response = await fetch(
    `${DISCORD_API}/guilds/${GUILD_ID}/roles`,
    {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Discord roles');
  }

  const roles: DiscordRole[] = await response.json();
  return roles.reduce((acc, role) => {
    acc[role.id] = role.name;
    return acc;
  }, {} as Record<string, string>);
}

export async function updateDiscordRoles(discordId: string, newRoles: string[]) {
  try {
    // Get current member roles
    const memberResponse = await fetch(
      `${DISCORD_API}/guilds/${GUILD_ID}/members/${discordId}`,
      {
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
        }
      }
    );

    if (!memberResponse.ok) {
      throw new Error('Failed to fetch member roles');
    }

    const memberData = await memberResponse.json();
    const currentRoles: string[] = memberData.roles || [];

    // Get role names mapping
    const roleNames = await getGuildRoles();

    // Get managed role IDs
    const managedRoleIds = Object.values(process.env)
      .filter(id => id && typeof id === 'string' && id.match(/^\d{17,19}$/))
      .map(id => id as string);

    console.log('Current Discord roles:', currentRoles);
    console.log('Managed role IDs:', managedRoleIds);

    // Remove all managed roles
    const rolesToRemove = currentRoles.filter(roleId => managedRoleIds.includes(roleId));
    console.log('Removing all managed roles:', rolesToRemove);

    for (const roleId of rolesToRemove) {
      console.log(`Removed role ${roleId} from ${discordId}`);
      await fetch(
        `${DISCORD_API}/guilds/${GUILD_ID}/members/${discordId}/roles/${roleId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
          }
        }
      );
    }

    // Add new roles
    const rolesToAdd = newRoles.filter(roleId => !currentRoles.includes(roleId));
    console.log('Roles to add:', rolesToAdd);

    for (const roleId of rolesToAdd) {
      console.log(`Added role ${roleId} to ${discordId}`);
      await fetch(
        `${DISCORD_API}/guilds/${GUILD_ID}/members/${discordId}/roles/${roleId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
          }
        }
      );
    }

    return {
      added: rolesToAdd.map(id => roleNames[id] || id),
      removed: rolesToRemove.map(id => roleNames[id] || id),
      previousRoles: currentRoles.map(id => roleNames[id] || id),
      newRoles: newRoles.map(id => roleNames[id] || id)
    };

  } catch (error) {
    console.error('Error updating Discord roles:', error);
    throw error;
  }
} 